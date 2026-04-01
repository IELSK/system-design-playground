import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

const TEST_USER = {
  email: "test@example.com",
  name: "Test User",
  password: "password123",
};

beforeAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.architecture.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.architecture.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("creates a new user and returns access token + refresh cookie", async () => {
    const res = await request(app).post("/auth/register").send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.name).toBe(TEST_USER.name);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/sdp_refresh_token/);
    expect(cookies[0]).toMatch(/HttpOnly/);
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/auth/register").send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it("rejects missing fields", async () => {
    const res = await request(app).post("/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  it("rejects short password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "short@test.com", name: "Short", password: "123" });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("returns access token + refresh cookie with valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it("rejects wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("rejects non-existent email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "ghost@test.com", password: "whatever123" });

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/refresh", () => {
  let refreshCookie: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    refreshCookie = res.headers["set-cookie"][0];
  });

  it("issues a new access token from a valid refresh cookie", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    // Rotation: old cookie should be replaced
    const newCookie = res.headers["set-cookie"]?.[0];
    expect(newCookie).toMatch(/sdp_refresh_token/);

    // Update for next tests
    refreshCookie = newCookie;
  });

  it("rejects when no cookie is sent", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("rejects a reused (rotated) token", async () => {
    // Login to get a fresh token
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const cookie = loginRes.headers["set-cookie"][0];

    // First refresh — should work
    await request(app).post("/auth/refresh").set("Cookie", cookie);

    // Second refresh with the same cookie — token was already rotated
    const res = await request(app).post("/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    accessToken = res.body.accessToken;
  });

  it("returns user data with valid access token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects request without token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects request with invalid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("invalidates the refresh token and clears the cookie", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const cookie = loginRes.headers["set-cookie"][0];

    const logoutRes = await request(app)
      .post("/auth/logout")
      .set("Cookie", cookie);

    expect(logoutRes.status).toBe(200);

    // Refresh with the same cookie should now fail
    const refreshRes = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookie);

    expect(refreshRes.status).toBe(401);
  });
});
