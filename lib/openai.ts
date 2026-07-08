import OpenAI from 'openai';

export async function callOpenAI(prompt: string, customOpenAiKey?: string): Promise<any> {
  const apiKey = (customOpenAiKey && customOpenAiKey.trim() !== '') ? customOpenAiKey : process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key' || apiKey.startsWith('your_') || apiKey === '') {
    console.warn('OPENAI_API_KEY is not set or is mock. Using mock engine fallback.');
    return getMockResponse(prompt);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sarcastic, witty codebase analyst. You analyze metrics and commit messages to output a humorous, roasted profile in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.substring(7);
    }
    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
    }
    cleanResponse = cleanResponse.trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Error calling OpenAI, falling back to mock response:', error);
    return getMockResponse(prompt);
  }
}

function getMockResponse(prompt: string): any {
  // ── Parse repo identity ──────────────────────────────────────────────────
  const repoMatch = prompt.match(/Repository:\s*([^\n]+)/);
  const repoName = repoMatch ? repoMatch[1].trim() : 'Unknown Repository';

  const descMatch = prompt.match(/Description:\s*([^\n]+)/);
  let description = descMatch ? descMatch[1].trim() : '';
  if (!description || description === 'No description provided.') {
    description = '';
  }

  // ── Parse README excerpt ─────────────────────────────────────────────────
  const readmeMatch = prompt.match(/Repository README\.md excerpt:\s*([\s\S]+?)\nTechnical Context:/);
  const rawReadme = readmeMatch ? readmeMatch[1].trim() : '';

  // Helper: strip common markdown formatting
  const stripMd = (s: string) =>
    s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
     .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
     .replace(/\*\*([^*]+)\*\*/g, '$1')
     .replace(/\*([^*]+)\*/g, '$1')
     .replace(/`([^`]+)`/g, '$1')
     .replace(/^#+\s*/gm, '')
     .replace(/<[^>]+>/g, '')
     .trim();

  // Split README into meaningful lines
  const readmeLines = rawReadme
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Filter out noise lines (image refs, short labels, badges, license text)
  const contentLines = readmeLines.filter(l =>
    l.length > 25 &&
    !l.startsWith('!') &&
    !l.startsWith('<') &&
    !l.toLowerCase().includes('license') &&
    !l.toLowerCase().includes('copyright') &&
    !l.toLowerCase().includes('badge') &&
    !l.match(/^\[!\[/)
  ).map(l => stripMd(l));

  // ── Build aboutProject ───────────────────────────────────────────────────
  // Take the first 2-3 substantial paragraphs from readme, or fall back to description
  const paragraphs = contentLines.filter(l => l.length > 40 && !l.startsWith('#'));
  let aboutProjectText = description || `A repository named ${repoName}.`;
  if (paragraphs.length > 0) {
    const best = paragraphs.slice(0, 3).join(' ');
    aboutProjectText = best.length > 600 ? best.slice(0, 597) + '...' : best;
  }

  // ── Build projectGoal ────────────────────────────────────────────────────
  let projectGoal = description
    ? `The project aims to ${description.toLowerCase().replace(/^the\s+/i, '').replace(/^a\s+/i, '')}.`
    : `${repoName} exists to provide developers with a reliable and powerful solution in its domain.`;
  if (paragraphs.length > 0) {
    const goalLine = paragraphs.find(p =>
      p.toLowerCase().includes('aim') ||
      p.toLowerCase().includes('goal') ||
      p.toLowerCase().includes('mission') ||
      p.toLowerCase().includes('purpose') ||
      p.toLowerCase().includes('designed to') ||
      p.toLowerCase().includes('built to') ||
      p.toLowerCase().includes('helps') ||
      p.toLowerCase().includes('allows') ||
      p.toLowerCase().includes('enables')
    );
    if (goalLine) projectGoal = goalLine.length > 200 ? goalLine.slice(0, 197) + '...' : goalLine;
  }

  // ── Build keyFeatures from README list items ─────────────────────────────
  const listItems = readmeLines
    .filter(l => l.match(/^[-*•]\s+/) || l.match(/^\d+\.\s+/))
    .map(l => stripMd(l.replace(/^[-*•\d.]+\s*/, '')))
    .filter(l => l.length > 15 && l.length < 150);

  let keyFeatures: string[];
  if (listItems.length >= 3) {
    keyFeatures = listItems.slice(0, 5);
  } else {
    // Generate generic features from languages and description keywords
    const langMatch2 = prompt.match(/Tech Stack \/ Languages \(estimate\):\s*([^\n]+)/);
    const langStr = langMatch2 ? langMatch2[1] : '';
    const primaryLang = langStr.split(',')[0]?.replace(/\([^)]+\)/, '').trim() || 'JavaScript';
    keyFeatures = [
      `Core functionality implemented in ${primaryLang}`,
      `Active development with frequent contributions`,
      `Open-source with community contributions`,
      description ? `${description.slice(0, 80)}` : `Provides a solution for developers in its domain`,
    ].filter(Boolean).slice(0, 4);
  }

  // ── Build useCases ────────────────────────────────────────────────────────
  const useCases: string[] = [];
  const useCaseKeywords = ['use', 'can be used', 'useful for', 'suitable for', 'designed for', 'built for', 'works with'];
  for (const line of contentLines) {
    if (useCaseKeywords.some(kw => line.toLowerCase().includes(kw)) && line.length < 200) {
      useCases.push(line.length > 150 ? line.slice(0, 147) + '...' : line);
      if (useCases.length >= 3) break;
    }
  }
  if (useCases.length === 0) {
    useCases.push(
      `Developers building applications with ${repoName.split('/')[1] || 'modern'} tooling`,
      `Teams looking for an open-source solution in this domain`,
    );
  }

  // ── Parse languages / tech stack ─────────────────────────────────────────
  const langMatch = prompt.match(/Tech Stack \/ Languages \(estimate\):\s*([^\n]+)/);
  const languagesStr = langMatch ? langMatch[1].trim() : 'JavaScript';
  const languagesList = languagesStr.split(',').map(l => l.replace(/\([^)]+\)/, '').trim());

  const depMatch = prompt.match(/Detected Dependencies:\s*([^\n]+)/);
  const depStr = depMatch ? depMatch[1].trim() : '';
  const depList = depStr && depStr !== 'None detected' ? depStr.split(',').map(d => d.trim()) : [];

  const techStack = Array.from(new Set([...languagesList, ...depList]))
    .filter(t => t && t !== 'Unknown' && t !== 'None' && t !== 'None detected')
    .slice(0, 8);

  // ── Personality metrics ───────────────────────────────────────────────────
  const fixMatch = prompt.match(/Fix Ratio:\s*([\d.]+)%/);
  const fixRatio = fixMatch ? parseFloat(fixMatch[1]) : 30;

  const testMatch = prompt.match(/Test Ratio:\s*([\d.]+)%/);
  const testRatio = testMatch ? parseFloat(testMatch[1]) : 5;

  const busMatch = prompt.match(/Bus Factor:\s*(\d+)/);
  const busFactor = busMatch ? parseInt(busMatch[1]) : 1;

  let archetype = 'The Chaotic Startup';
  let summary = `${repoName} is a classic example of high-velocity feature shipping with a healthy disregard for tests. Commits are frequent, late-night hacks are common, and the codebase feels like a Jenga tower waiting for that one load-bearing abstraction to be removed.`;
  const traits = [
    {
      name: 'Developer Anxiety',
      score: Math.min(Math.round(fixRatio * 1.5), 100),
      description: `With a fix ratio of ${fixRatio.toFixed(1)}%, the devs spend significant time putting out fires.`,
      evidence: 'High volume of "fix" and "patch" commits in the history.'
    },
    {
      name: 'Test Phobia',
      score: Math.max(100 - Math.round(testRatio * 3), 0),
      description: `With a test ratio of ${testRatio.toFixed(1)}%, writing tests is a luxury rather than a necessity.`,
      evidence: 'Files with "test" or "spec" are rarer than clean git rebases here.'
    },
    {
      name: 'Lone Wolf Syndrome',
      score: busFactor <= 1 ? 95 : 40,
      description: busFactor <= 1
        ? 'A single person owns more than half the commits. One distracted developer and this repo goes dark.'
        : 'Commit ownership is distributed across multiple developers.',
      evidence: `Bus factor of ${busFactor} indicates ${busFactor <= 1 ? 'concentrated' : 'distributed'} code knowledge.`
    }
  ];

  if (fixRatio > 50) {
    archetype = 'The Nocturnal Firefighter';
    summary = 'Welcome to the emergency room. This codebase consists almost entirely of fixes, hotfixes, and quick patches. Feature development is a distant memory, and the code is screaming for refactoring.';
  } else if (testRatio > 25) {
    archetype = 'The Quality Assurance Bureaucrat';
    summary = 'This codebase is cleaner than a surgical theater. Safety is the first, second, and third priority. Progress is slow but bulletproof.';
  } else if (busFactor === 1) {
    archetype = 'The Solo Crusader';
    summary = 'A single developer has built an empire here. Highly personalized, filled with abstractions only one brain understands. A work of art — terrifying to inherit.';
  }

  return {
    aboutProject: aboutProjectText,
    projectGoal,
    keyFeatures,
    useCases,
    techStack: techStack.length > 0 ? techStack : ['JavaScript'],
    archetype,
    summary,
    traits,
    predictions: [
      'The next major release will break the build, but only for users running Safari on macOS Monterey.',
      'A new developer joining the project will spend their first two weeks asking "Why is this library here?"',
      `The bus factor will remain ${busFactor} until the lead developer discovers a new framework.`
    ],
    shareableBadges: [
      archetype,
      testRatio < 5 ? 'Living on the Edge' : 'Safety First',
      fixRatio > 40 ? 'Firefighter' : 'Feature Machine'
    ]
  };
}

export async function callOpenAIForContributors(prompt: string, contributorsMetrics: any[], customOpenAiKey?: string): Promise<any> {
  const apiKey = (customOpenAiKey && customOpenAiKey.trim() !== '') ? customOpenAiKey : process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key' || apiKey.startsWith('your_') || apiKey === '') {
    console.warn('OPENAI_API_KEY is not set or is mock. Using mock contributor engine fallback.');
    return getMockContributorsResponse(contributorsMetrics);
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sarcastic, witty codebase analyst. You analyze contributor metrics to output a humorous, roasted profile in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.substring(7);
    }
    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
    }
    cleanResponse = cleanResponse.trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Error calling OpenAI for contributors, falling back to mock response:', error);
    return getMockContributorsResponse(contributorsMetrics);
  }
}

function getMockContributorsResponse(contributorsMetrics: any[]): any {
  const contributors = contributorsMetrics.map((c) => {
    const commitsCount = c.commitsCount || 0;
    const fixRatio = c.ratios.fix || 0;
    const testRatio = c.ratios.test || 0;
    const avgCommitSize = c.averageCommitSize || 0;
    const prsOpened = c.prsOpened || 0;
    const lang = c.languages[0]?.language || 'code';

    let archetype = 'The Consistent Builder';
    let summary = `This contributor averages around ${avgCommitSize} lines per commit. They are a reliable cog in this chaotic repository, pushing ${commitsCount} commits, mostly working with ${lang}.`;
    let superlatives = ['Consistent Coder', `${lang} Writer`];

    if (commitsCount <= 3) {
      archetype = 'The Drive-By Committer';
      summary = `With only ${commitsCount} commits, this contributor appears to drop in, push some code, and disappear before anyone can ask questions. A true master of hit-and-run development.`;
      superlatives = ['Hit and Run', 'Mysterious Guest'];
    } else if (fixRatio > 40) {
      archetype = 'The Nocturnal Firefighter';
      summary = `Welcome to the emergency department. ${fixRatio.toFixed(0)}% of this author's commits are fixes or patches. They are likely writing code in a state of high anxiety, fixing bugs that they (or their peers) pushed yesterday.`;
      superlatives = ['Code Firefighter', 'Anxiety Engine'];
    } else if (testRatio > 15) {
      archetype = 'The Quality Assurance Disciple';
      summary = `Writing specs and testing is this author's core passion. With a test ratio of ${testRatio.toFixed(0)}%, they are the only reason this repository builds successfully in CI.`;
      superlatives = ['CI Savior', 'Test Guru'];
    } else if (avgCommitSize > 400) {
      archetype = 'The One-Line Bloater';
      summary = `This author rarely commits, but when they do, they drop a massive load-bearing commit containing over ${avgCommitSize} lines of code. It makes git diffs completely unreadable.`;
      superlatives = ['Jenga Master', 'Mega Committer'];
    } else if (prsOpened === 0 && commitsCount > 5) {
      archetype = 'The Silent Git Anarchist';
      summary = `Pushes commits straight to the main branch without any PR review. Code reviews are seen as an unnecessary speed bump. A lone wolf operating in the shadows.`;
      superlatives = ['Direct Pusher', 'Git Rebel'];
    }

    const traits = [
      {
        name: 'Anxiety Factor',
        score: Math.min(Math.round(fixRatio * 1.6), 100),
        description: `With a bug-fix ratio of ${fixRatio.toFixed(0)}%, this developer is constantly fighting regressions.`
      },
      {
        name: 'Test Discipline',
        score: Math.min(Math.round(testRatio * 4.5), 100),
        description: `With a test ratio of ${testRatio.toFixed(0)}%, writing tests is ${testRatio > 10 ? 'a high priority' : 'seen as a luxury'}.`
      },
      {
        name: 'Chaos Score',
        score: prsOpened === 0 ? 90 : Math.max(10, 100 - Math.round(testRatio * 2)),
        description: prsOpened === 0 ? 'Pushes straight to main, inducing maximum anxiety.' : 'Submits code for review but keeps average commit size high.'
      }
    ];

    const funFact = prsOpened === 0 && commitsCount > 0
      ? 'Pushed directly to the main branch without ever opening a pull request.'
      : `Pushes code primarily in ${lang} with a longest streak of ${c.streaks.longestStreak} days.`;

    const contributionType = fixRatio > 35 
      ? 'Bug Fixing & Stability' 
      : testRatio > 10 
        ? 'Testing & Quality Assurance' 
        : 'Feature Implementation';

    const featuresImplemented = [
      `Implemented core components in ${lang || 'JavaScript'}`,
      `Refactored helper classes and optimized performance`,
      `Resolved bug reports and improved build stability`
    ].slice(0, commitsCount > 2 ? 3 : 1);

    return {
      username: c.username,
      archetype,
      summary,
      contributionType,
      featuresImplemented,
      traits,
      superlatives,
      funFact
    };
  });

  return { contributors };
}

