 // For pages/api/items/feedback.js or app/api/items/feedback/route.ts

// Next.js Pages Router version
export default async function handler(req, res) {
    // Log the request headers for debugging
    console.log("Request headers:", req.headers);
    
    // Get the authorization token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Missing or invalid authorization header");
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token (use your auth library's method)
      // For Next-Auth:
      // const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      
      // For JWT token verification:
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // For simpler testing (NOT FOR PRODUCTION):
      // Just check if token exists
      if (!token) {
        return res.status(401).json({ error: "Unauthorized - Token verification failed" });
      }
      
      // Process the request
      if (req.method === 'POST') {
        // Handle your feedback logic here
        
        return res.status(200).json({ success: true });
      } else {
        return res.status(405).json({ error: "Method not allowed" });
      }
      
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ error: "Unauthorized - Token verification failed" });
    }
  }
  
  // App Router version (Next.js 13+)
  // app/api/items/feedback/route.ts
  export async function POST(request) {
    // Get headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token (use your auth library's method)
      // For JWT verification:
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Process the request
      const data = await request.json();
      
      // Handle your feedback logic here
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      console.error("Authentication error:", error);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Token verification failed" }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }