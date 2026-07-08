import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params;

    let archetype = 'Unanalyzed';
    let riskScore = 0;
    let hasData = false;

    try {
      const dbRepo = await prisma.repository.findFirst({
        where: {
          owner: owner.toLowerCase(),
          name: repo.toLowerCase(),
        },
      }) || await prisma.repository.findFirst({
        where: {
          owner,
          name: repo,
        },
      });

      if (dbRepo) {
        const profile = dbRepo.profileJson ? JSON.parse(dbRepo.profileJson as string) : null;
        const health = dbRepo.healthJson ? JSON.parse(dbRepo.healthJson as string) : null;
        if (profile) {
          archetype = profile.archetype || 'Analyzed';
          riskScore = health?.riskScore ?? 40;
          hasData = true;
        }
      }
    } catch (dbError) {
      console.warn('Prisma lookup failed in badge route:', dbError);
    }

    // Determine colors
    const labelBg = '#312e81'; // Deep indigo
    let archetypeBg = '#6b21a8'; // Purple
    if (!hasData) archetypeBg = '#475569'; // Slate for unanalyzed

    let riskColor = '#10b981'; // Emerald
    if (riskScore > 65) riskColor = '#ef4444'; // Red
    else if (riskScore > 35) riskColor = '#f59e0b'; // Amber

    // SVG graphics parameters
    const badgeText = 'Profiler AI';
    const archetypeText = archetype;
    const riskText = hasData ? `Risk: ${riskScore}%` : 'Scan Now';

    // Calculate approximate text widths for clean rendering
    const labelWidth = badgeText.length * 7 + 12;
    const archetypeWidth = archetypeText.length * 6.5 + 16;
    const riskWidth = riskText.length * 7 + 12;
    const totalWidth = labelWidth + archetypeWidth + riskWidth;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20">
      <linearGradient id="g" x2="0" y2="100%">
        <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
        <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
        <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
        <stop offset="1" stop-color="#000" stop-opacity=".5"/>
      </linearGradient>
      
      <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="4" fill="#fff"/>
      </clipPath>
      
      <g clip-path="url(#r)">
        <!-- Left: Badge Label -->
        <rect width="${labelWidth}" height="20" fill="${labelBg}"/>
        
        <!-- Middle: Archetype -->
        <rect x="${labelWidth}" width="${archetypeWidth}" height="20" fill="${archetypeBg}"/>
        
        <!-- Right: Risk Score -->
        <rect x="${labelWidth + archetypeWidth}" width="${riskWidth}" height="20" fill="${riskColor}"/>
        
        <!-- 3D Overlay -->
        <rect width="${totalWidth}" height="20" fill="url(#g)"/>
      </g>
      
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
        <!-- Text Shadows -->
        <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${badgeText}</text>
        <text x="${labelWidth + archetypeWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${archetypeText}</text>
        <text x="${labelWidth + archetypeWidth + riskWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${riskText}</text>
        
        <!-- Main white text -->
        <text x="${labelWidth / 2}" y="14">${badgeText}</text>
        <text x="${labelWidth + archetypeWidth / 2}" y="14" font-weight="bold">${archetypeText}</text>
        <text x="${labelWidth + archetypeWidth + riskWidth / 2}" y="14">${riskText}</text>
      </g>
    </svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (err: any) {
    console.error('Badge endpoint error:', err);
    return new NextResponse('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><text y="14">Error</text></svg>', {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}
