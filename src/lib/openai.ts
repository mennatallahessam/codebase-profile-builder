import OpenAI from 'openai';

export async function callOpenAI(prompt: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
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
  // Parse some numbers from prompt to make mock slightly dynamic if possible
  const fixMatch = prompt.match(/Fix Ratio:\s*([\d.]+)%/);
  const fixRatio = fixMatch ? parseFloat(fixMatch[1]) : 30;

  const testMatch = prompt.match(/Test Ratio:\s*([\d.]+)%/);
  const testRatio = testMatch ? parseFloat(testMatch[1]) : 5;

  const busMatch = prompt.match(/Bus Factor:\s*(\d+)/);
  const busFactor = busMatch ? parseInt(busMatch[1]) : 1;

  let archetype = 'The Chaotic Startup';
  let summary = 'This codebase is a classic example of high-velocity feature shipping with a healthy disregard for tests. Commits are frequent, late-night hacks are common, and the codebase feels like a Jenga tower waiting for that one load-bearing CSS class to be deleted.';
  let traits = [
    {
      name: 'Developer Anxiety',
      score: Math.min(Math.round(fixRatio * 1.5), 100),
      description: `With a fix ratio of ${fixRatio.toFixed(1)}%, your devs spend a significant amount of time putting out fires. The commit messages suggest a high level of stress.`,
      evidence: 'High volume of "fix" and "patch" commits, with a few exclamation marks in the mix.'
    },
    {
      name: 'Test Phobia',
      score: Math.max(100 - Math.round(testRatio * 3), 0),
      description: `With a test ratio of ${testRatio.toFixed(1)}%, writing tests is seen as a luxury rather than a necessity. The team is living life on the edge.`,
      evidence: 'Files with "test" or "spec" are rarer than clean git rebases here.'
    },
    {
      name: 'Lone Wolf Syndrome',
      score: busFactor <= 1 ? 95 : 40,
      description: busFactor <= 1 
        ? 'A single person owns more than half the commits. If this person gets distracted by a shiny new JS framework, this repository will freeze in time.' 
        : 'Commit ownership is distributed across a few developers, though hierarchy is still apparent.',
      evidence: `Bus factor of ${busFactor} indicates a concentrated point of failure.`
    }
  ];

  if (fixRatio > 50) {
    archetype = 'The Nocturnal Firefighter';
    summary = 'Welcome to the emergency room. This codebase consists almost entirely of fixes, hotfixes, and quick patches. Feature development is a distant memory, and the code is screaming for refactoring. The developers are likely working in shifts to keep the lights on.';
  } else if (testRatio > 25) {
    archetype = 'The Quality Assurance Bureaucrat';
    summary = 'This codebase is cleaner than a surgical theater. With testing metrics that dwarf standard startups, safety is the first, second, and third priority. Progress is slow, but absolutely bulletproof. Deployments are likely preceded by three committees and a formal signing ceremony.';
  } else if (busFactor === 1) {
    archetype = 'The Solo Crusader';
    summary = 'A single developer has built an empire here. It is highly personalized, filled with custom abstractions that only make sense in one brain, and written with incredible speed. It is a work of art, but a terrifying one to inherit.';
  }

  return {
    archetype,
    summary,
    traits,
    predictions: [
      'The next major release will break the build, but only for users running Safari on macOS Monterey.',
      'A new developer joining the project will spend their first two weeks asking "Why is this library here?"',
      'The bus factor will remain 1 until the lead developer decides to go on a digital detox.'
    ],
    shareableBadges: [
      archetype,
      testRatio < 5 ? 'Living on the Edge' : 'Safety First',
      fixRatio > 40 ? 'Firefighter' : 'Feature Machine'
    ]
  };
}

export async function callOpenAIForContributors(prompt: string, contributorsMetrics: any[]): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
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

    return {
      username: c.username,
      archetype,
      summary,
      traits,
      superlatives,
      funFact
    };
  });

  return { contributors };
}

