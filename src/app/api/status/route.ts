import { NextResponse } from 'next/server';

export async function GET() {
  const githubToken = process.env.GITHUB_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  const hasGithubToken = !!(
    githubToken &&
    githubToken !== 'your_github_pat' &&
    !githubToken.startsWith('your_') &&
    githubToken.trim() !== ''
  );

  const hasOpenAiKey = !!(
    openaiKey &&
    openaiKey !== 'your_openai_key' &&
    !openaiKey.startsWith('your_') &&
    openaiKey.trim() !== ''
  );

  return NextResponse.json({
    hasGithubToken,
    hasOpenAiKey,
    githubRateLimit: hasGithubToken ? 5000 : 60,
  });
}
