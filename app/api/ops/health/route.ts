export async function GET() {
  return Response.json({
    status: "ok",
    service: "indaba",
    timestamp: new Date().toISOString(),
  });
}
