import { NextRequest, NextResponse } from 'next/server';

interface WebVitalData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url?: string;
  userAgent?: string;
}

/**
 * API endpoint for collecting Web Vitals data
 * This can be extended to store data in a database or send to analytics services
 */
export async function POST(request: NextRequest) {
  try {
    const data: WebVitalData = await request.json();
    
    // Add additional context
    const enrichedData = {
      ...data,
      url: request.headers.get('referer') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: data.timestamp || Date.now(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };

    // Validate the data
    if (!data.name || typeof data.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid web vital data' },
        { status: 400 }
      );
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital collected:', enrichedData);
    }

    // In production, you would typically:
    // 1. Store in a database
    // 2. Send to analytics service (Google Analytics, DataDog, etc.)
    // 3. Send to monitoring service (Sentry, LogRocket, etc.)
    
    // Example: Store in database
    // await db.webVitals.create({ data: enrichedData });
    
    // Example: Send to external analytics
    // await sendToAnalytics(enrichedData);
    
    // Example: Send to monitoring service
    // await sendToMonitoring(enrichedData);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error processing web vital:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve aggregated metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const metric = searchParams.get('metric');

    // In a real implementation, you would query your database
    // const metrics = await db.webVitals.aggregate({
    //   where: {
    //     timestamp: {
    //       gte: getTimeframeStart(timeframe)
    //     },
    //     ...(metric && { name: metric })
    //   },
    //   _avg: { value: true },
    //   _count: true,
    //   groupBy: ['name', 'rating']
    // });

    // Mock response for development
    const mockMetrics = {
      timeframe,
      metrics: [
        { name: 'FCP', avg: 1200, count: 150, rating: 'good' },
        { name: 'LCP', avg: 2100, count: 145, rating: 'good' },
        { name: 'FID', avg: 45, count: 120, rating: 'good' },
        { name: 'CLS', avg: 0.05, count: 140, rating: 'good' },
        { name: 'TTFB', avg: 650, count: 150, rating: 'good' }
      ]
    };

    return NextResponse.json(mockMetrics);
    
  } catch (error) {
    console.error('Error retrieving web vitals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions (implement based on your needs)
function getTimeframeStart(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

async function sendToAnalytics(data: WebVitalData) {
  // Example: Send to Google Analytics 4
  // const response = await fetch('https://www.google-analytics.com/mp/collect', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     client_id: 'your-client-id',
  //     events: [{
  //       name: 'web_vital',
  //       params: {
  //         metric_name: data.name,
  //         metric_value: data.value,
  //         metric_rating: data.rating
  //       }
  //     }]
  //   })
  // });
}

async function sendToMonitoring(data: WebVitalData) {
  // Example: Send to Sentry
  // Sentry.addBreadcrumb({
  //   category: 'web-vital',
  //   message: `${data.name}: ${data.value}`,
  //   level: data.rating === 'poor' ? 'warning' : 'info',
  //   data
  // });
}