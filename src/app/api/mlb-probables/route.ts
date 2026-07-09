export async function GET() {
  return Response.json({
    message: "MLB probable pitchers route is working",
    status: "ready",
  });
}