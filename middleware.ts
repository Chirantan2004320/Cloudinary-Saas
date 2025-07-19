import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const ispublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/",
    "/home"
])

const ispublicApiRoute = createRouteMatcher([
    "/api/videos"
])

export default clerkMiddleware((auth, req) => {
    const {userId} = auth();
    const currenturl = new URL(req.url)
    const isAccessingDashboard = currenturl.pathname === "/home"
    const isApiRequest = currenturl.pathname.startsWith("/api")

    if(userId && ispublicRoute(req) && !isAccessingDashboard){
      return NextResponse.redirect(new URL("/home", req.url))
    }

    if(!userId){
      if(!ispublicRoute(req) && !ispublicApiRoute(req)){
           return NextResponse.redirect(new URL("/sign-in", req.url))          
      }
      if(isApiRequest && ispublicApiRoute(req)){
        return NextResponse.redirect(new URL("/sign-in", req.url)) 
      }

    }

    return NextResponse.next() 

})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}