import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'Missing report ID' }, { status: 400 });
    }

    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
    }

    const dbRepo = await prisma.repository.findUnique({
      where: { id },
      include: {
        contributors: {
          include: {
            contributorMetrics: true,
            contributorProfile: true,
          },
        },
      },
    });

    if (!dbRepo) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Reconstruction of full result from the database representation
    const profile = dbRepo.profileJson ? JSON.parse(dbRepo.profileJson as string) : {};
    const metrics = dbRepo.metricsJson ? JSON.parse(dbRepo.metricsJson as string) : {};
    const health = dbRepo.healthJson ? JSON.parse(dbRepo.healthJson as string) : null;

    const contributors = dbRepo.contributors.map((c: any) => {
      const cMetrics = c.contributorMetrics ? JSON.parse(c.contributorMetrics.detailsJson as string) : {};
      const cProfile = c.contributorProfile ? {
        archetype: c.contributorProfile.archetype,
        summary: c.contributorProfile.summary,
        traits: JSON.parse(c.contributorProfile.traitsJson as string),
        superlatives: JSON.parse(c.contributorProfile.superlativesJson as string),
        funFact: c.contributorProfile.funFact,
      } : {};
      return {
        username: c.username,
        avatarUrl: c.avatarUrl,
        displayName: c.displayName,
        ...cMetrics,
        profile: cProfile,
      };
    });

    // We can also estimate or store collaborationGraph inside healthJson or metricsJson.
    // If not stored explicitly, we default to empty list or reconstruct if possible.
    const collaborationGraph: any[] = [];

    const fullResult = {
      id: dbRepo.id,
      repository: {
        owner: dbRepo.owner,
        name: dbRepo.name,
        url: dbRepo.url,
      },
      metrics,
      profile,
      health,
      contributors,
      collaborationGraph,
      lastAnalyzed: dbRepo.createdAt.toISOString(),
    };

    return NextResponse.json(fullResult);
  } catch (err: any) {
    console.error('Error fetching report:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
