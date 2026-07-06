-- Seed the task_templates library from the AEO/GEO-first methodology.
-- phase values: "0_onboarding", "1_discovery", "2_clustering", "3_onpage",
-- "4_offpage", "5_technical", "recurring"

insert into public.task_templates (phase, title, description, default_type, default_role, default_risk_tier, recurring) values

-- Phase 0: Onboarding / baseline audit
('0_onboarding', 'Citation baseline audit', 'Query ChatGPT, Perplexity, and Google AI Overviews for the client''s top 15 topics and record who is currently cited.', 'geo', 'seo_specialist', 'routine', false),
('0_onboarding', 'Brand entity presence audit', 'Check for existing presence on Wikipedia, Wikidata, Reddit, YouTube, LinkedIn, and G2.', 'off_page', 'seo_specialist', 'routine', false),
('0_onboarding', 'AI crawler access audit', 'Check robots.txt for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, and Google-Extended access.', 'technical', 'dev', 'routine', false),
('0_onboarding', 'Server-side rendering check', 'Confirm core content renders without requiring client-side JavaScript.', 'technical', 'dev', 'routine', false),

-- Phase 1: Entity & topic discovery
('1_discovery', 'Extract core entities from business brief', 'Identify the product, category, problem, and audience entities (not just keywords).', 'seo', 'seo_specialist', 'routine', false),
('1_discovery', 'Mine conversational queries', 'Collect real natural-language questions people ask AI assistants in this space, from forums, Reddit, and community threads.', 'aeo', 'seo_specialist', 'routine', false),
('1_discovery', 'Citation gap analysis per platform', 'For each priority query, record who is currently cited on ChatGPT, Perplexity, and Google AI Overviews.', 'geo', 'seo_specialist', 'routine', false),
('1_discovery', 'Traditional keyword/volume research', 'Supporting-layer keyword research with search volume and difficulty.', 'seo', 'seo_specialist', 'routine', false),

-- Phase 2: Clustering & prioritization
('2_clustering', 'Cluster keywords/topics by entity', 'Group related queries into one comprehensive resource per topic cluster.', 'seo', 'seo_specialist', 'routine', false),
('2_clustering', 'Score clusters by citability opportunity', 'Identify clusters with a unique data point, definition, or answer nobody currently owns.', 'geo', 'manager', 'routine', false),
('2_clustering', 'Identify original research opportunities', 'Find data/survey opportunities unique to this client that create citable content.', 'geo', 'manager', 'routine', false),

-- Phase 3: On-page for AI extractability
('3_onpage', 'Write definition-first opening', 'Add a clear "X is..." definition within the first 40-60 words of the page.', 'content', 'content_writer', 'routine', false),
('3_onpage', 'Structure self-contained answer blocks', 'Rewrite key passages as 134-167 word blocks that are extractable without surrounding context.', 'geo', 'content_writer', 'routine', false),
('3_onpage', 'Add question-format headings', 'Rework H2/H3 headings to match real query phrasing.', 'aeo', 'content_writer', 'routine', false),
('3_onpage', 'Add sourced statistics', 'Add specific, attributed data points in place of vague claims.', 'content', 'content_writer', 'routine', false),
('3_onpage', 'Add author byline and credentials', 'Add a named author with credentials, and link to their professional profile if applicable.', 'content', 'content_writer', 'routine', false),
('3_onpage', 'Add publish/update dates', 'Ensure publish and last-updated dates are visible on the page.', 'content', 'content_writer', 'routine', false),
('3_onpage', 'Implement schema markup', 'Add FAQPage, HowTo, Speakable, Person, or Article schema as appropriate.', 'technical', 'seo_specialist', 'routine', false),
('3_onpage', 'Add multi-modal content', 'Embed a relevant image, video, or chart on the page.', 'content', 'content_writer', 'routine', false),
('3_onpage', 'Verify SSR for this page', 'Confirm the page renders server-side without depending on client JS.', 'technical', 'dev', 'routine', false),

-- Phase 4: Off-page / brand entity building
('4_offpage', 'Wikipedia notability assessment', 'Assess whether the brand/product/founder plausibly meets Wikipedia notability guidelines.', 'off_page', 'seo_specialist', 'routine', false),
('4_offpage', 'Wikidata entry creation/update', 'Create or update a Wikidata entry with sameAs links to brand properties.', 'off_page', 'seo_specialist', 'routine', false),
('4_offpage', 'Genuine Reddit participation', 'Participate authentically in relevant subreddits — no manufactured engagement.', 'off_page', 'seo_specialist', 'routine', false),
('4_offpage', 'YouTube presence build-out', 'Publish or grow video content mentioning the brand/topics.', 'off_page', 'content_writer', 'routine', false),
('4_offpage', 'G2 / Quora presence and reviews', 'Claim or build out listings and encourage genuine reviews.', 'off_page', 'seo_specialist', 'routine', false),
('4_offpage', 'LinkedIn thought leadership', 'Publish posts from founders/experts on relevant topics.', 'off_page', 'content_writer', 'routine', false),
('4_offpage', 'Traditional backlink/digital PR outreach', 'Supporting-layer link building and PR outreach.', 'off_page', 'seo_specialist', 'routine', false),
('4_offpage', 'Unlinked brand mention reclamation', 'Find unlinked brand mentions and request attribution links.', 'off_page', 'seo_specialist', 'routine', false),

-- Phase 5: Technical AI accessibility
('5_technical', 'Configure robots.txt for AI crawlers', 'Allow GPTBot, OAI-SearchBot, ClaudeBot, and PerplexityBot; decide on training crawlers.', 'technical', 'dev', 'routine', false),
('5_technical', 'Create /llms.txt', 'Publish an llms.txt with site description, key page links, and key facts.', 'technical', 'seo_specialist', 'routine', false),
('5_technical', 'Fix client-rendered content blocking crawlers', 'Resolve any pages that hide core content from non-JS crawlers.', 'technical', 'dev', 'routine', false),

-- Recurring / ongoing monitoring
('recurring', 'Citation tracking check', 'Query priority phrases across ChatGPT, Claude, Perplexity, and check AI Overviews SERP presence.', 'geo', 'seo_specialist', 'routine', true),
('recurring', 'Brand mention monitoring', 'Check for new or lost mentions on Reddit, YouTube, and Wikipedia.', 'off_page', 'seo_specialist', 'routine', true),
('recurring', 'Technical health check', 'Review crawl errors, Core Web Vitals, and broken links.', 'technical', 'dev', 'routine', true),
('recurring', 'Content refresh review', 'Check top-performing pages for ranking/traffic decline and refresh as needed.', 'content', 'content_writer', 'routine', true),
('recurring', 'New topic opportunity scan', 'Scan for new keyword/topic opportunities based on recent query trends.', 'seo', 'seo_specialist', 'routine', true);
