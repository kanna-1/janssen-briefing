import { articles } from "../src/lib/db/schema";
import { db } from "../src/lib/db";

function singaporeDate(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const demoArticles: (typeof articles.$inferInsert)[] = [
  {
    slug: "ai-agents-move-into-business-workflows",
    title: "AI agents move from demos into everyday business workflows",
    sourceUrl: "https://example.com/technology/ai-agents-business-workflows",
    sourceDomain: "example.com",
    summary:
      "Teams are increasingly evaluating agents by reliability, auditability, and measurable time saved rather than by demo quality alone.",
    category: "Technology",
    feed: "demo-tech",
    date: singaporeDate(0),
    readingTime: 5,
    clipped: true,
    library: true,
    savedAt: new Date(),
    content:
      "# AI agents move into business workflows\n\nThe latest generation of AI agents is being judged on whether it can complete useful work safely. Product teams are adding explicit tools, permission boundaries, approval steps, and evaluation suites before allowing agents to change production systems.\n\nThe shift is changing engineering priorities. Reliable retrieval, structured outputs, observability, and graceful failure modes now matter as much as model quality. Teams that measure latency, accuracy, and intervention rates are better positioned to decide where automation creates genuine value.",
    relevanceScore: 0.96,
    sourceId: "demo-ai-agents",
  },
  {
    slug: "regional-startups-focus-on-efficient-growth",
    title: "Southeast Asian startups focus on efficient product growth",
    sourceUrl: "https://example.com/business/sea-startups-efficient-growth",
    sourceDomain: "example.com",
    summary:
      "Product teams across the region are pairing smaller experiments with clearer retention and revenue measurements.",
    category: "Business",
    feed: "demo-business",
    date: singaporeDate(0),
    readingTime: 4,
    clipped: true,
    library: false,
    content:
      "# Efficient growth becomes a product discipline\n\nStartups across Southeast Asia are concentrating on sustainable acquisition, retention, and operational efficiency. Rather than treating growth as a marketing-only problem, teams are connecting product analytics with customer interviews and smaller release cycles.\n\nThe approach favours experiments with a clear hypothesis, success metric, and decision deadline. This makes unsuccessful ideas cheaper and gives successful ideas a stronger evidence base for further investment.",
    relevanceScore: 0.91,
    sourceId: "demo-startups-growth",
  },
  {
    slug: "markets-price-in-new-rate-outlook",
    title: "Markets adjust as investors reassess the rate outlook",
    sourceUrl: "https://example.com/markets/investors-rate-outlook",
    sourceDomain: "example.com",
    summary:
      "Equity and currency markets moved as traders revised expectations for the pace of future interest-rate changes.",
    category: "Markets",
    feed: "demo-markets",
    date: singaporeDate(0),
    readingTime: 3,
    clipped: true,
    library: false,
    content:
      "# Investors reassess the rate outlook\n\nGlobal markets traded in a narrow range while investors compared inflation data with central-bank guidance. Technology shares were mixed, while short-duration government bonds reflected expectations that policy would remain data dependent.\n\nAnalysts cautioned that one release rarely establishes a durable trend. They highlighted employment, services inflation, and corporate earnings as the next signals likely to shape positioning.",
    relevanceScore: 0.86,
    sourceId: "demo-rate-outlook",
    storyGroup: "rate-outlook",
  },
  {
    slug: "technology-shares-react-to-rate-expectations",
    title: "Technology shares react to changing rate expectations",
    sourceUrl: "https://example.org/finance/technology-shares-rates",
    sourceDomain: "example.org",
    summary:
      "Growth stocks fluctuated as lower and higher rate scenarios competed for investors' attention.",
    category: "Markets",
    feed: "demo-finance",
    date: singaporeDate(0),
    readingTime: 4,
    clipped: true,
    library: false,
    content:
      "# Technology shares react to rate expectations\n\nTechnology shares moved unevenly as investors reconsidered the path for interest rates. Companies with strong cash flow held up better than more speculative names.\n\nPortfolio managers said the market response reflected changes in valuation assumptions rather than a broad change in the long-term technology outlook.",
    relevanceScore: 0.82,
    sourceId: "demo-tech-rates",
    storyGroup: "rate-outlook",
  },
  {
    slug: "developers-treat-ai-output-as-a-draft",
    title: "Developers treat AI-generated code as a draft, not a final answer",
    sourceUrl: "https://example.net/engineering/ai-code-review",
    sourceDomain: "example.net",
    summary:
      "Engineering teams are combining AI-assisted development with type checking, tests, documentation, and human review.",
    category: "Engineering",
    feed: "demo-engineering",
    date: singaporeDate(1),
    readingTime: 6,
    clipped: true,
    library: true,
    savedAt: new Date(Date.now() - 86_400_000),
    content:
      "# AI-generated code still needs engineering judgement\n\nCoding assistants can accelerate exploration and implementation, but they can also produce outdated APIs, insecure defaults, or code that only appears correct. Experienced teams provide precise context and then validate suggestions with the same controls applied to human-written code.\n\nUseful safeguards include framework-version constraints, small diffs, automated tests, static analysis, and explicit acceptance criteria. The goal is faster feedback without transferring responsibility away from the engineer.",
    relevanceScore: 0.94,
    sourceId: "demo-ai-code-review",
  },
  {
    slug: "ecommerce-teams-improve-checkout-reliability",
    title: "E-commerce teams prioritize checkout reliability",
    sourceUrl: "https://example.com/ecommerce/checkout-reliability",
    sourceDomain: "example.com",
    summary:
      "Retail platforms are reducing failed payments and slow pages by improving observability across the checkout path.",
    category: "E-commerce",
    feed: "demo-commerce",
    date: singaporeDate(2),
    readingTime: 4,
    clipped: true,
    library: false,
    content:
      "# Checkout reliability receives renewed attention\n\nE-commerce engineering teams are tracing the full checkout path from browser interaction to payment provider response. The work combines frontend performance measurement, API monitoring, idempotent payment handling, and clearer recovery states for customers.\n\nEven small improvements can matter at scale because latency and confusing failures directly affect conversion. Teams are increasingly reviewing technical reliability alongside product analytics.",
    relevanceScore: 0.88,
    sourceId: "demo-checkout-reliability",
  },
];

async function main() {
  for (const article of demoArticles) {
    await db
      .insert(articles)
      .values(article)
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: article.title,
          summary: article.summary,
          content: article.content,
          date: article.date,
          relevanceScore: article.relevanceScore,
          library: article.library,
          savedAt: article.savedAt,
          storyGroup: article.storyGroup,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seeded ${demoArticles.length} portfolio articles.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
