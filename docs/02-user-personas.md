# 02 · User Personas — Dreams by Kalakaaar v2

**Document owner:** UX Research & Product Management
**Status:** Draft for review
**Audience:** Product, Design, Engineering, Marketing, Business, Support, Future team members
**Companion documents:** `00-project-vision.md`, `01-product-requirements.md`

---

# 1. Introduction

### 1.1 Purpose

This document defines the people Dreams by Kalakaaar v2 is built for — buyers, creators, and the internal team that operates the platform. It exists so that every product, design, and business decision can be evaluated against a real, specific understanding of who is affected and why, rather than an abstract or generic notion of "the user."

Personas here are not marketing caricatures. Each one is grounded in the problems, audiences, and principles already established in `00-project-vision.md`, and each is written with enough behavioral and emotional detail that a designer could sketch their journey, an engineer could reason about their edge cases, and a support agent could recognize them in a real conversation.

### 1.2 Objectives

1. Give every team member — regardless of function — a shared, specific mental model of who uses the platform.
2. Ground the functional modules and requirements defined in `01-product-requirements.md` in real human motivations, so "why" is never lost as the product scales.
3. Surface pain points from existing alternatives (Etsy, Amazon Handmade, Instagram, WhatsApp, offline shopping) that Dreams by Kalakaaar must address.
4. Provide a foundation for journey mapping, usability testing recruitment, accessibility design, and prioritization trade-offs.
5. Make explicit which personas are primary today, which are secondary, which are internal, and which are edge cases — so design and engineering effort is allocated deliberately, not evenly.

### 1.3 Relationship to Other Documents

| Document | Relationship |
|---|---|
| `00-project-vision.md` | Defines the target audience segments (Section 6), user goals (Section 7), and brand personality (Section 18) that these personas make specific and actionable. Every persona in this document maps to a segment introduced there. |
| `01-product-requirements.md` | Defines the roles (Section 3), modules (Section 4), and requirements (Section 5) that these personas will use. This document explains *why* those requirements matter to a real person; the PRD explains *what* was built in response. |

This document should be read **before** any screen design, journey map, or usability test plan is created.

---

# 2. Persona Framework

To avoid treating every persona as equally important — a common cause of unfocused product decisions — personas are classified into four tiers.

| Tier | Definition | Design/Product Implication |
|---|---|---|
| **Primary Personas** | Represent the largest or most strategically important share of actual usage and revenue. Their needs should win most prioritization trade-offs. | Every core flow (search, checkout, storefront, dashboard) must work excellently for these personas before any secondary need is addressed. |
| **Secondary Personas** | Real, valuable users whose needs matter but who should not dictate the default experience if it conflicts with a primary persona's needs. | Their needs are addressed through configuration, flexibility, or targeted features — not by changing the default experience. |
| **Internal Personas** | Anthropic — sorry, Dreams by Kalakaaar — employees and operators who keep the marketplace healthy, trustworthy, and running. | Their tools are held to the same product-quality bar as buyer/creator-facing surfaces, since operational efficiency directly affects buyer and creator experience. |
| **Edge Personas** | Real but low-frequency or boundary-condition users (accessibility needs, unusual purchase contexts, future markets) whose needs reveal risk and future opportunity even when they are not the design default. | Used to stress-test flows for robustness and inclusivity, and to inform the future roadmap, without becoming the default design target today. |

This tiering is applied explicitly in Section 6 (Comparison Matrix) and Section 12 (Goals Matrix).

---

# 3. Buyer Personas

### 3.1 Persona 1 — Meaningful Gift Buyer

**Name:** Ananya Rao
**Age:** 29
**Occupation:** Marketing Manager at a mid-sized fintech company
**Income:** ₹14,00,000 per year
**Location:** Bengaluru, Karnataka
**Tech Comfort:** High — comfortable across apps, uses multiple shopping and productivity tools daily

| Attribute | Detail |
|---|---|
| **Goals** | Find a gift that feels personal and thoughtful, not generic; complete the purchase without excessive research time; be confident it will arrive before the occasion. |
| **Motivations** | Wants to be seen as someone who gives good gifts; values relationships and uses gifting to express care she doesn't always have time to express in person. |
| **Pain Points** | Struggles to find gifts that don't feel like "the same thing everyone buys"; anxious about delivery timing for occasion-based purchases; unsure which sellers are trustworthy when searching generically online. |
| **Buying Behaviour** | Searches with an occasion or relationship in mind ("gift for sister's housewarming") rather than a specific product name; browses on mobile during commute or lunch breaks, often completes purchase on desktop in the evening. |
| **Decision Factors** | Emotional resonance of the product, delivery timeline certainty, seller credibility, ability to personalize. |
| **Preferred Devices** | Mobile for browsing, desktop or mobile for final purchase — roughly even split. |
| **Shopping Frequency** | Occasion-driven; purchases 6–10 times per year specifically for gifting. |
| **Emotional Drivers** | Wants to feel like a good friend/family member; fears choosing something forgettable or impersonal; relief and satisfaction when she finds "the right thing." |
| **Trust Expectations** | Expects clear seller information, realistic delivery estimates, and responsive communication if something is delayed — she is buying for someone else and cannot afford surprises. |
| **Accessibility Needs** | None specific; standard mobile and desktop usage patterns. |
| **Frustrations** | Generic marketplaces burying good products under irrelevant search results; vague delivery windows; no easy way to add a gift note. |
| **Quote** | *"I don't want to just send a gift — I want them to know I actually thought about them."* |
| **Success Definition** | She finds a product that feels personal within a reasonable amount of browsing time, customizes it easily, and it arrives on time with the recipient genuinely surprised and touched. |

---

### 3.2 Persona 2 — Conscious Shopper

**Name:** Devika Menon
**Age:** 34
**Occupation:** Freelance UX writer
**Income:** ₹9,50,000 per year (variable, project-based)
**Location:** Pune, Maharashtra
**Tech Comfort:** High — works primarily online, comfortable evaluating digital products and platforms critically

| Attribute | Detail |
|---|---|
| **Goals** | Support independent creators directly rather than large retailers; buy fewer, better things; understand the origin and story behind what she buys. |
| **Motivations** | Personal values around sustainability and fair livelihoods; enjoys the story and craftsmanship behind a product as much as the product itself; dislikes contributing to mass production and disposable consumption. |
| **Pain Points** | Difficulty verifying whether something marketed as "handmade" actually is; frustration when marketplaces mix genuine artisans with resellers of mass-produced goods; wants to know how much of her money actually reaches the maker. |
| **Buying Behaviour** | Researches before buying — reads maker bios, checks reviews, sometimes messages the seller directly with questions; less price-sensitive than convenience-sensitive when the story is credible. |
| **Decision Factors** | Authenticity and transparency, maker story, materials and process, evidence of fair treatment of the creator. |
| **Preferred Devices** | Desktop for research-heavy sessions, mobile for quick follow-up purchases from known/trusted sellers. |
| **Shopping Frequency** | Moderate — 1–2 purchases per month, deliberate rather than impulsive. |
| **Emotional Drivers** | Pride in aligning purchases with her values; skepticism toward marketing claims; satisfaction from a genuine connection to a maker's story. |
| **Trust Expectations** | Wants verifiable authenticity signals (not just marketing copy), transparent seller information, and a platform that actively curates rather than allows anything to be listed. |
| **Accessibility Needs** | None specific. |
| **Frustrations** | Marketplaces where "handmade" is unverified and often untrue; no visibility into who actually made a product or how; platforms that prioritize algorithmic reach over authenticity. |
| **Quote** | *"If I'm going to spend more for something handmade, I want to actually know it's handmade — and that the maker is doing okay."* |
| **Success Definition** | She can quickly verify a creator's authenticity, feels confident her purchase genuinely supports them, and the product matches the story she was told. |

---

### 3.3 Persona 3 — Design Collector

**Name:** Rohan Kapoor
**Age:** 38
**Occupation:** Architect, partner at a small design studio
**Income:** ₹22,00,000 per year
**Location:** Mumbai, Maharashtra
**Tech Comfort:** High, but values aesthetics and experience over technical sophistication

| Attribute | Detail |
|---|---|
| **Goals** | Curate a home and personal style with distinctive, well-made objects; avoid anything that feels mass-produced or trend-driven; build a small, considered collection over time. |
| **Motivations** | Sees objects as an extension of personal and professional identity; appreciates craftsmanship, material quality, and design intention; enjoys discovering makers before they become widely known. |
| **Pain Points** | Most marketplaces present products with poor photography and inconsistent presentation quality; hard to browse by aesthetic sensibility rather than category; discovery feels transactional rather than editorial. |
| **Buying Behaviour** | Browses for inspiration even without immediate purchase intent; willing to pay a premium for exceptional quality and presentation; often returns to the same trusted creators repeatedly. |
| **Decision Factors** | Visual and material quality, design coherence, uniqueness, presentation quality of the listing itself. |
| **Preferred Devices** | Desktop primarily, for a larger, higher-fidelity browsing experience; mobile for quick re-visits to saved items. |
| **Shopping Frequency** | Low-to-moderate frequency, higher average order value — 4–6 purchases per year, often higher value pieces. |
| **Emotional Drivers** | Pride of ownership; enjoyment of the discovery and "hunt"; frustration when presentation quality undermines an otherwise good product. |
| **Trust Expectations** | Expects accurate representation of materials, dimensions, and finish; wants confidence that what arrives matches the presented quality bar. |
| **Accessibility Needs** | None specific. |
| **Frustrations** | Cluttered, low-quality listing photography; marketplaces that feel like a bazaar rather than a curated space; inconsistent quality across a single platform. |
| **Quote** | *"I'm not just buying an object. I'm buying into someone's point of view."* |
| **Success Definition** | He discovers something distinctive he wouldn't have found elsewhere, the presentation matched the delivered quality, and the piece becomes a lasting part of his space or wardrobe. |

---

### 3.4 Persona 4 — Occasional Buyer

**Name:** Priya Sharma
**Age:** 45
**Occupation:** School administrator
**Income:** ₹7,00,000 per year
**Location:** Jaipur, Rajasthan
**Tech Comfort:** Moderate — comfortable with common apps (messaging, basic shopping) but not an enthusiastic explorer of new platforms

| Attribute | Detail |
|---|---|
| **Goals** | Quickly find and buy something appropriate for a specific, upcoming occasion (a colleague's wedding, a festival gift exchange) without a long learning curve. |
| **Motivations** | Social obligation and care for relationships rather than personal shopping enjoyment; wants to fulfill the occasion appropriately and move on. |
| **Pain Points** | Unfamiliar platforms feel risky and time-consuming to learn; worries about entering payment details on a site she doesn't recognize; doesn't want to create yet another account for a one-time need. |
| **Buying Behaviour** | Arrives with a specific, near-term need; prefers being guided (curated suggestions, clear categories) over open-ended search; likely to abandon if the process feels complicated. |
| **Decision Factors** | Simplicity of the process, clear trust signals (recognizable payment methods, clear policies), speed. |
| **Preferred Devices** | Mobile, almost exclusively. |
| **Shopping Frequency** | Low — 2–4 times per year, strictly occasion-triggered. |
| **Emotional Drivers** | Mild anxiety about "getting it right" for a specific social occasion; relief when the process is fast and clear; unlikely to explore further once the immediate need is met. |
| **Trust Expectations** | Needs strong, immediate trust signals since she has no prior relationship with the platform — clear policies, familiar payment options, visible customer support. |
| **Accessibility Needs** | Prefers larger text and simple navigation; not a power user of complex filtering or advanced features. |
| **Frustrations** | Mandatory account creation for a one-time purchase; complicated checkout flows; unclear return/refund policy. |
| **Quote** | *"I just need something nice, quickly, and I need to know it's not going to be a hassle if something goes wrong."* |
| **Success Definition** | She completes her purchase in a single short session without needing help, and it arrives in time for the occasion without any follow-up required from her.

---

# 4. Creator Personas

### 4.1 Independent Artisan

**Name (representative):** Lakshmi Iyer, potter and ceramicist

| Attribute | Detail |
|---|---|
| **Background** | Trained under a master potter for several years before starting her own practice; sells primarily functional and decorative ceramics from a home studio. |
| **Business Size** | Solo operator; no employees; occasional help from a family member during high-order periods. |
| **Products** | Hand-thrown ceramic bowls, mugs, vases, and small batches of seasonal decorative pieces. |
| **Revenue Stage** | Modest but growing steady income; craft is her primary livelihood, supplemented by occasional workshops. |
| **Pain Points** | Struggles to photograph and describe work in a way that conveys texture and craftsmanship; discovery on generic marketplaces is dominated by cheaper, mass-produced lookalikes; manages orders and messages across multiple disconnected apps. |
| **Workflow** | Produces in batches based on kiln capacity; manually tracks orders in a notebook and spreadsheet; ships via a local courier she has a personal relationship with. |
| **Goals** | Build a recognizable personal brand; reduce time spent on non-craft administrative work; earn a stable, predictable income from her craft. |
| **Tools Used Today** | Instagram for presence, WhatsApp for order coordination, a basic spreadsheet for tracking, cash/UPI for payment collection. |
| **Technology Comfort** | Moderate — comfortable with everyday apps, not a power user of business software or dashboards. |
| **Biggest Fear** | Investing time in a platform that doesn't bring genuine buyers, or that undervalues her work by placing it next to mass-produced items at similar prices. |
| **Biggest Motivation** | The ability to sustain her craft as a livelihood without compromising on quality or process. |
| **Success Metrics** | Steady month-over-month order volume; fair, predictable payout timing; buyers who understand and value the handmade nature of her work. |

---

### 4.2 Personalized Product Creator

**Name (representative):** Farhan Sheikh, calligrapher and custom engraver

| Attribute | Detail |
|---|---|
| **Background** | Started as a hobbyist calligrapher, transitioned to offering custom name art, engraved gifts, and personalized wedding stationery. |
| **Business Size** | Solo, with a close collaborator for high-volume wedding season orders. |
| **Products** | Custom-lettered art, engraved keepsakes, personalized gift sets built to buyer specification. |
| **Revenue Stage** | Growing, with significant seasonal spikes (wedding season, festivals) and quieter off-peak months. |
| **Pain Points** | Managing back-and-forth clarification with buyers over customization details through unstructured chat; production delays caused by unclear or incomplete buyer input; difficulty setting realistic lead-time expectations during peak demand. |
| **Workflow** | Reviews each custom request individually, often requests clarification, produces to order, ships once complete; heavily dependent on clear communication before production starts. |
| **Goals** | Reduce miscommunication-driven rework; set buyer expectations clearly on turnaround time; smooth out seasonal demand spikes where possible. |
| **Tools Used Today** | Instagram DMs and WhatsApp for order intake and clarification, a shared spreadsheet for order tracking, manual invoicing. |
| **Technology Comfort** | Moderate-to-high — comfortable adapting to new tools if they clearly reduce his current chaos. |
| **Biggest Fear** | A miscommunicated customization request leading to a wasted, unsellable custom piece and an unhappy buyer. |
| **Biggest Motivation** | Seeing a buyer's delighted reaction to a truly personal, well-made piece — the emotional payoff of his craft. |
| **Success Metrics** | Reduced clarification cycles per order; on-time delivery rate during peak season; repeat buyers for recurring occasions (e.g., annual anniversary gifts). |

---

### 4.3 Small Creative Studio

**Name (representative):** Studio Baaya (3-person home décor and textile studio)

| Attribute | Detail |
|---|---|
| **Background** | Founded by two friends with complementary skills (design and production), now employing one additional part-time maker; positions itself as a small but professional brand rather than a single artisan identity. |
| **Business Size** | 3 people: one owner handling brand/sales, one handling production, one part-time production support. |
| **Products** | Hand-block-printed textiles, cushion covers, table linens, and small-batch home décor collections. |
| **Revenue Stage** | Established and profitable at a small scale; reinvesting in materials and slowly expanding capacity. |
| **Pain Points** | Coordinating who is responsible for what (orders, production, shipping) without a shared system; keeping brand presentation consistent as more than one person contributes; balancing collection launches with steady day-to-day order fulfillment. |
| **Workflow** | Plans seasonal collections in advance, produces in batches, fulfills day-to-day orders from existing stock alongside batch production for new releases. |
| **Goals** | Operate with the professionalism of a larger brand while staying true to a two-person creative vision; delegate operational tasks without losing quality control. |
| **Tools Used Today** | A basic Shopify-like storefront for stocked items, Instagram for brand storytelling, WhatsApp Business for buyer communication, a shared spreadsheet for internal coordination. |
| **Technology Comfort** | High — comfortable with business tools and willing to adopt new systems that support team coordination. |
| **Biggest Fear** | Losing the personal, story-led brand identity as the studio takes on more team members and formalizes operations. |
| **Biggest Motivation** | Building a lasting, recognizable brand that reflects their shared creative vision and supports the small team sustainably. |
| **Success Metrics** | Consistent brand presentation across team-managed touchpoints; smooth internal handoffs between team members; growing repeat-buyer base recognizing the studio by name. |

---

### 4.4 Hobby Creator

**Name (representative):** Meera Joshi, weekend jewelry maker

| Attribute | Detail |
|---|---|
| **Background** | Full-time software tester who makes beaded and wire-wrapped jewelry as a creative outlet; has sold occasionally to friends and through local pop-up events. |
| **Business Size** | Solo, very part-time; makes and sells in small batches around a full-time job. |
| **Products** | Handmade jewelry — earrings, bracelets, and small accessories, produced in limited quantities. |
| **Revenue Stage** | Pre-revenue to very early revenue; treats sales as supplementary income and creative validation rather than a primary livelihood. |
| **Pain Points** | Low confidence that her work is "professional enough" to sell on a proper platform; limited time to manage a storefront alongside a full-time job; unsure how to price her work fairly. |
| **Workflow** | Makes in small batches during evenings and weekends; currently sells informally through friends, family, and local events; has never used a formal e-commerce tool. |
| **Goals** | Test whether there's genuine demand for her work beyond her immediate circle; learn how to present and price her work professionally; grow into a more serious side business over time. |
| **Tools Used Today** | Instagram for occasional posts, informal cash/UPI transactions at pop-ups and among friends. |
| **Technology Comfort** | High in general technology use (her day job is technical), but no experience with e-commerce or seller tools specifically. |
| **Biggest Fear** | Publicly "putting herself out there" as a seller and receiving no interest, or being compared unfavorably to more established creators. |
| **Biggest Motivation** | Creative fulfillment and the possibility — not yet the certainty — of turning a hobby into something more. |
| **Success Metrics** | Her first few sales to strangers (not friends/family); positive feedback validating her pricing and quality; a low-pressure path to gradually increasing her selling activity. |

---

### 4.5 Emerging Creator

**Name (representative):** Arjun Verma, recent design graduate

| Attribute | Detail |
|---|---|
| **Background** | Recently graduated from a design program, specializing in leatherwork; deciding whether to pursue independent creative work full-time or seek traditional employment. |
| **Business Size** | Solo, just starting; no established customer base yet. |
| **Products** | Handcrafted leather goods — wallets, small bags, journals — currently a small, evolving catalog as he refines his signature style. |
| **Revenue Stage** | Pre-revenue; this is his first attempt at selling his own work commercially. |
| **Pain Points** | No existing audience or reputation to leverage; uncertain how to write compelling product descriptions or price competitively without undervaluing his time; anxious about the administrative and business side of selling, which was not covered in his design education. |
| **Workflow** | Producing a small initial catalog before attempting to sell; has not yet fulfilled a real customer order. |
| **Goals** | Successfully launch and validate his first collection; learn the operational side of running a creative business with guidance rather than trial and error; build initial credibility and reviews. |
| **Tools Used Today** | Instagram for portfolio presentation, no selling tools yet in active use. |
| **Technology Comfort** | High — comfortable with digital tools generally, but a first-time user of any commerce or seller platform. |
| **Biggest Fear** | Launching to silence — investing significant effort into his first collection and having no buyers discover it. |
| **Biggest Motivation** | Proving to himself (and often, implicitly, to family expecting a more conventional career path) that independent creative work is viable. |
| **Success Metrics** | Successfully completing his first sale and fulfillment cycle; positive early reviews; a clear, encouraging path from zero to steady initial traction. |

---

# 5. Internal Personas

### 5.1 Admin

**Name (representative):** Kavya Nair, Marketplace Operations Admin

| Aspect | Detail |
|---|---|
| **Responsibilities** | Reviewing and approving creator applications, managing categories and collections, configuring platform-wide promotions, resolving escalated disputes within policy, monitoring overall marketplace health. |
| **KPIs** | Creator application turnaround time, listing/creator approval quality (low post-approval violation rate), dispute resolution time, overall marketplace trust indicators (dispute rate, review authenticity). |
| **Daily Workflow** | Starts the day reviewing a queue of pending creator applications and flagged content; monitors dashboards for anomalies (spikes in disputes, unusual listing activity); handles escalations from Support Executives and Moderators; coordinates with CMS updates for merchandising campaigns. |
| **Pain Points** | Balancing thoroughness in creator verification against the pressure to keep onboarding fast enough not to discourage genuine applicants; incomplete information from applicants slowing down review; recurring, avoidable escalations that indicate a gap in Support's decision authority. |
| **Goals** | Maintain a consistently high-quality, trustworthy marketplace without becoming a bottleneck to legitimate growth. |
| **Decision Making** | Applies documented policy consistently, escalates ambiguous or high-stakes cases to Super Admin rather than setting ad hoc precedent, prioritizes review queues by risk and applicant wait time. |

---

### 5.2 Moderator

**Name (representative):** Rahul Desai, Trust & Safety Moderator

| Aspect | Detail |
|---|---|
| **Responsibilities** | Reviewing flagged listings, reviews, and storefront content for authenticity, quality, and conduct violations; taking direct action within their authority (warning, content removal) and escalating higher-severity cases. |
| **KPIs** | Time to review flagged content, consistency of moderation decisions against policy, false-positive/false-negative rate on moderation actions, appeal outcome rate (as a quality signal on decision accuracy). |
| **Daily Workflow** | Works through a prioritized queue of flagged items; investigates context (listing history, prior violations, buyer/creator communication where relevant to a dispute); documents reasoning for every action taken. |
| **Pain Points** | Ambiguous cases that don't clearly fit documented policy; volume spikes that risk rushed decisions; creators pushing back emotionally on moderation decisions, especially around livelihood-affecting actions like suspension. |
| **Goals** | Protect buyer trust and platform authenticity while being fair and consistent to creators, whose livelihoods are directly affected by moderation decisions. |
| **Decision Making** | Applies a severity framework consistently (see `01-product-requirements.md` Section 7.19); escalates suspension/termination-level decisions rather than acting unilaterally; documents reasoning thoroughly to support the appeal process. |

---

### 5.3 Support Executive

**Name (representative):** Sneha Pillai, Customer Support Executive

| Aspect | Detail |
|---|---|
| **Responsibilities** | Responding to buyer and creator support tickets, resolving order issues (delays, defects, miscommunication) within policy, issuing refunds/credits within authorized limits, escalating complex or high-severity cases. |
| **KPIs** | Ticket resolution time, first-contact resolution rate, customer satisfaction score post-resolution, escalation rate (as an efficiency and training signal). |
| **Daily Workflow** | Works through an inbound ticket queue prioritized by severity and SLA proximity; gathers context from order, payment, and message history; communicates resolution steps to the buyer/creator; escalates when a case exceeds her authority or requires policy judgment. |
| **Pain Points** | Incomplete context requiring back-and-forth with the buyer/creator to resolve; policy edge cases not clearly covered by documentation; emotionally charged conversations, particularly around delayed gifts tied to specific occasions. |
| **Goals** | Resolve issues quickly and fairly, leaving both buyers and creators feeling heard, without needing to escalate routine cases unnecessarily. |
| **Decision Making** | Follows documented refund/resolution policy for standard cases; uses judgment within authorized limits for reasonable exceptions; escalates when a case falls outside policy or involves significant financial/reputational risk. |

---

### 5.4 Founder

**Name (representative):** Aditi Bhatt, Co-Founder

| Aspect | Detail |
|---|---|
| **Responsibilities** | Setting overall product and business direction, ensuring the platform stays true to its vision and principles as it scales, making high-stakes policy and resource decisions, representing the company to investors and key partners. |
| **KPIs** | Marketplace growth (GMV, active creators/buyers), creator retention and satisfaction, buyer trust indicators (NPS, dispute rate), business sustainability (unit economics, runway). |
| **Daily Workflow** | Reviews high-level marketplace and business metrics; engages directly with select creators and buyers to stay close to the ground truth behind the numbers; makes or approves significant product, policy, and resourcing decisions; represents the company externally. |
| **Pain Points** | Balancing the discipline of a focused, curated platform against the pressure to grow quickly; ensuring the operational team (Admin, Moderator, Support) can scale their judgment consistently as volume grows beyond what founders can personally oversee. |
| **Goals** | Build a platform that genuinely improves creators' livelihoods and buyers' gifting experience, while building a durable, sustainable business around it. |
| **Decision Making** | Weighs decisions against the product principles defined in `00-project-vision.md` Section 9; willing to trade short-term growth for long-term trust and quality; delegates operational decisions but retains authority over irreversible or values-defining choices. |

---

# 6. Persona Comparison Matrix

| Persona | Buying Frequency | Tech Comfort | Price Sensitivity | Trust Requirement | Customization Need | Support Need | Decision Speed | Average Order Value | Repeat Purchase Likelihood |
|---|---|---|---|---|---|---|---|---|---|
| Meaningful Gift Buyer | Occasion-driven (6–10/yr) | High | Medium | High | High | Medium | Medium | Medium–High | High |
| Conscious Shopper | Moderate (1–2/mo) | High | Low–Medium | Very High | Medium | Low | Slow (research-heavy) | Medium | High |
| Design Collector | Low (4–6/yr) | High | Low | High | Low–Medium | Low | Slow (deliberate) | High | High |
| Occasional Buyer | Very Low (2–4/yr) | Moderate | High | Very High (first-time) | Low | High | Fast | Low–Medium | Low–Medium |
| Independent Artisan (as buyer of platform services) | N/A — Creator | Moderate | High (margin-sensitive) | High | N/A | High | Medium | N/A | High (platform loyalty) |
| Personalized Product Creator | N/A — Creator | Moderate–High | High (margin-sensitive) | High | N/A | High | Medium | N/A | High |
| Small Creative Studio | N/A — Creator | High | Medium | High | N/A | Medium | Fast | N/A | High |
| Hobby Creator | N/A — Creator | High (general tech), Low (commerce) | High | Medium | N/A | High | Slow (cautious) | N/A | Uncertain (testing phase) |
| Emerging Creator | N/A — Creator | High | High | Medium | N/A | Very High | Slow (learning) | N/A | Uncertain (testing phase) |

*Note: Creator personas are compared on buying-adjacent dimensions where applicable (e.g., their reliance on platform tools/support), since their core relationship to the platform is as sellers, not buyers.*

---

# 7. User Motivations

### 7.1 Intrinsic Motivations
- Personal joy in giving thoughtful, meaningful gifts (Meaningful Gift Buyer).
- Alignment between purchasing behavior and personal values (Conscious Shopper).
- Aesthetic pleasure and self-expression through curated objects (Design Collector).
- Creative fulfillment independent of commercial outcome (Hobby Creator).
- Pride of craftsmanship and desire to sustain a traditional or personal creative practice (Independent Artisan).

### 7.2 Extrinsic Motivations
- Social validation from successful, well-received gift-giving (Meaningful Gift Buyer).
- Recognition and reputation-building as a maker (Emerging Creator, Small Creative Studio).
- Financial sustainability and predictable income (all Creator personas).
- Social obligation fulfillment for occasions (Occasional Buyer).

### 7.3 Emotional Motivations
- Fear of choosing something forgettable or inappropriate for an occasion (Meaningful Gift Buyer, Occasional Buyer).
- Anxiety about authenticity and being misled (Conscious Shopper).
- Pride and identity expression through curated possessions (Design Collector).
- Fear of public failure or rejection when starting to sell (Hobby Creator, Emerging Creator).
- Desire to feel that one's livelihood is respected and fairly valued (all Creator personas).

### 7.4 Functional Motivations
- Need for a fast, low-friction purchase process under time pressure (Occasional Buyer).
- Need for reliable delivery timing tied to a fixed date (Meaningful Gift Buyer).
- Need for efficient order and communication management without juggling multiple tools (all Creator personas).
- Need for clear guidance when unfamiliar with selling as a business (Hobby Creator, Emerging Creator).

---

# 8. User Pain Points (Current Alternatives)

### 8.1 Current Marketplace Problems (General)
- Search results dominated by volume and price rather than genuine relevance or quality.
- Inconsistent presentation quality undermines trust in the overall platform, even for good creators.
- No clear way to verify authenticity claims (e.g., "handmade").

### 8.2 Instagram Problems
- No structured commerce infrastructure — no cart, no checkout, no order tracking.
- Discovery is algorithm-dependent and ephemeral rather than durable and searchable.
- Direct messages become an ad hoc, unstructured order and support system, error-prone for both sides.

### 8.3 WhatsApp Problems
- Entirely manual order tracking, prone to lost or forgotten messages.
- No formal payment protection for either buyer or seller.
- No structured record of customization requirements, leading to production errors.

### 8.4 Etsy Problems
- Cluttered, inconsistent storefront presentation across sellers.
- Diluted by resellers and drop-shippers, undermining trust in "handmade" claims.
- Seller experience widely perceived as impersonal, with limited brand differentiation.

### 8.5 Amazon Handmade Problems
- Handmade positioning buried within a broader, general-retail experience and interface.
- Sellers compete on Amazon's general marketplace terms rather than a craft-specific model.
- Limited storytelling or brand-building opportunity for individual creators.

### 8.6 Offline Shopping Problems
- Limited geographic reach — buyers can only discover creators local to them or at specific events (fairs, exhibitions).
- No persistent record of purchase, communication, or easy re-purchase from a favorite maker.
- Inconvenient for time-constrained buyers, particularly for occasion-driven purchases.

---

# 9. User Behaviour

| Stage | Buyer Behaviour |
|---|---|
| **Discovery** | Arrives via search (specific need), browsing (inspiration-driven), or referral/social sharing; occasion-driven buyers often start with a relationship or event in mind rather than a product category. |
| **Research** | Reads maker story and reviews; compares presentation quality and authenticity signals; for Conscious Shoppers and Design Collectors, this stage can be extensive and deliberate. |
| **Comparison** | Compares across a small set of shortlisted products/creators, weighing price, customization options, and delivery timeline rather than pure price comparison across many undifferentiated listings. |
| **Purchase** | Decision speed varies sharply by persona — Occasional Buyers move fast under time pressure; Design Collectors and Conscious Shoppers deliberate; Meaningful Gift Buyers balance urgency (occasion deadline) with care (wanting the right choice). |
| **Post-Purchase** | Expects clear order tracking and proactive communication, especially for time-sensitive gifts; anxiety peaks around delivery timing for occasion-driven buyers. |
| **Reviews** | Motivated by wanting to support a creator they genuinely valued (Conscious Shopper, Design Collector) or by a strong positive/negative experience (Meaningful Gift Buyer); Occasional Buyers are least likely to leave a review absent a notably good or bad experience. |
| **Sharing** | Design Collectors and Conscious Shoppers are more likely to organically share discoveries (social proof, personal identity signaling); Meaningful Gift Buyers may share post-gift-reveal reactions. |
| **Loyalty** | Driven by trust in a specific creator more than platform loyalty per se — buyers return to makers they've had a good experience with, reinforcing the importance of creator-level trust and relationship continuity. |

---

# 10. Accessibility Personas

### 10.1 Low Vision

**Representative context:** A buyer with moderate low vision who relies on browser zoom and high-contrast settings.
- **Needs:** Scalable text without layout breakage, strong color contrast, no reliance on color alone to convey meaning (e.g., stock status, form errors).
- **Risk if unmet:** Inability to read product details, prices, or complete checkout independently.

### 10.2 Color Blind

**Representative context:** A creator managing their dashboard who has red-green color blindness.
- **Needs:** Status indicators (e.g., order states, inventory alerts) distinguishable through shape, icon, or label — not color alone.
- **Risk if unmet:** Misreading critical order or inventory status, leading to fulfillment errors.

### 10.3 Motor Impairment

**Representative context:** A buyer with limited fine motor control who navigates primarily via keyboard or switch-access device.
- **Needs:** Full keyboard navigability, generously sized touch/click targets, no interactions that require precise, fast, or simultaneous input.
- **Risk if unmet:** Inability to complete core flows like adding customization details or checkout independently.

### 10.4 Screen Reader Users

**Representative context:** A blind buyer using a screen reader to browse and purchase independently.
- **Needs:** Meaningful, well-structured content that reads logically aloud, descriptive labeling of images and interactive elements, clear announcement of dynamic changes (e.g., cart updates, form errors).
- **Risk if unmet:** Complete inability to use the platform independently, directly contradicting the platform's accessibility principle.

### 10.5 Older Adults

**Representative context:** A buyer in their late 60s purchasing a gift for a grandchild, with limited familiarity with newer digital interaction patterns.
- **Needs:** Clear, unambiguous labeling and instructions; forgiving error handling; minimal reliance on gestures or interactions that aren't broadly familiar.
- **Risk if unmet:** Task abandonment due to confusion or lack of confidence, particularly at checkout.

### 10.6 Slow Internet Users

**Representative context:** A buyer or creator in a lower-connectivity region relying on mobile data with inconsistent speed.
- **Needs:** Fast-loading, lightweight core experiences; graceful degradation rather than failure when connectivity is poor; clear feedback when an action is pending versus failed.
- **Risk if unmet:** Abandoned purchases or failed order management actions, disproportionately affecting creators and buyers outside major urban centers.

---

# 11. Journey Triggers

| Trigger | Typical Persona(s) | Behavioral Implication |
|---|---|---|
| **Birthday** | Meaningful Gift Buyer, Occasional Buyer | Deadline-driven; personalization highly valued; moderate research time. |
| **Wedding** | Meaningful Gift Buyer, Personalized Product Creator (as fulfiller) | Higher average order value; strong demand for customization (names, dates); longer planning horizon. |
| **Festival** | Occasional Buyer, Meaningful Gift Buyer | Seasonal demand spikes; often multiple smaller purchases (e.g., gifts for several people). |
| **Housewarming** | Meaningful Gift Buyer, Design Collector | Home décor category emphasis; aesthetic fit with recipient's taste is a key concern. |
| **Corporate Gift** | Occasional Buyer (on behalf of an organization), future Corporate Buyer persona (Section 13) | Bulk or repeat purchasing need; currently underserved — see Future Personas. |
| **Anniversary** | Meaningful Gift Buyer | High emotional stakes; strong preference for personalization and meaningful symbolism. |
| **Baby Shower** | Meaningful Gift Buyer, Occasional Buyer | Category emphasis on soft goods, keepsakes; gift registry behavior emerging (see Future Personas). |
| **Personal Hobby** | Design Collector, Conscious Shopper | Self-directed, non-occasion purchasing; slower, exploratory behavior driven by personal interest rather than a deadline. |

---

# 12. Persona Goals Matrix

Each cell indicates the relative importance of the goal to that persona (High / Medium / Low).

| Persona | Trust | Speed | Customization | Price | Quality | Discovery | Support | Brand |
|---|---|---|---|---|---|---|---|---|
| Meaningful Gift Buyer | High | Medium | High | Medium | High | Medium | Medium | Medium |
| Conscious Shopper | High | Low | Medium | Low | High | High | Low | High |
| Design Collector | High | Low | Low | Low | Very High | High | Low | High |
| Occasional Buyer | Very High | Very High | Low | High | Medium | Low | High | Low |
| Independent Artisan | High | Medium | Low | High | High | High | High | High |
| Personalized Product Creator | High | Medium | Very High | High | High | Medium | High | Medium |
| Small Creative Studio | High | Medium | Medium | Medium | High | High | Medium | Very High |
| Hobby Creator | Medium | Low | Low | Medium | Medium | Medium | Very High | Low |
| Emerging Creator | Medium | Low | Low | Medium | Medium | High | Very High | Medium |

---

# 13. Future Personas

The following personas are not designed for in v2 (consistent with `00-project-vision.md` Section 24 and `01-product-requirements.md` Section 14) but are documented here to inform long-term product and architectural thinking.

### 13.1 International Buyers
Buyers outside the initial launch market seeking authentic regional craftsmanship, likely motivated by cultural connection or gifting across distance. Would require localization, international shipping, and currency support not addressed in v2.

### 13.2 Wholesale Buyers
Retailers or boutique owners seeking to purchase in bulk at negotiated pricing for resale. Fundamentally different purchasing behavior (bulk quantity, negotiated terms, recurring relationships) from the individual gifting-driven buyer personas above.

### 13.3 Corporate Buyers
Organizations purchasing gifts at scale for employees, clients, or events. Needs bulk ordering, invoicing, and often a degree of customization consistency across many recipients — distinct from the individual Meaningful Gift Buyer's one-at-a-time, emotionally driven purchase.

### 13.4 Luxury Buyers
Buyers seeking the highest tier of craftsmanship and exclusivity, potentially willing to commission bespoke, high-value pieces with white-glove service expectations beyond the current Design Collector persona's needs.

### 13.5 Collectors
Buyers building an intentional collection around a specific creator, medium, or style over time, with interest in provenance, limited editions, and direct relationships with makers — an intensified version of the Design Collector persona.

### 13.6 Gift Registry Users
Buyers and couples/families creating a curated list of desired handmade items for events like weddings or baby showers, inviting others to purchase from that list — a distinct, multi-party purchasing behavior not present in today's single-buyer model.

---

# 14. Key Insights

### 14.1 Top 20 UX Insights

1. Buyers rarely search by product name — they search by relationship, occasion, or feeling ("gift for my sister," "something warm for a housewarming").
2. Delivery timing certainty matters as much as product quality for occasion-driven buyers; ambiguity creates disproportionate anxiety.
3. Trust signals must be visible at the point of decision, not buried in policy pages — buyers won't dig for reassurance.
4. Presentation quality (photography, storytelling) directly affects perceived authenticity, independent of the product's actual quality.
5. First-time, low-frequency buyers need a fundamentally simpler path than power users — the same flow cannot optimize equally for both without careful design.
6. Customization flows must prevent ambiguity at the source, since after-the-fact clarification is costly for both buyer and creator.
7. Creators are not power users of business software by default — the platform's operational tools must be forgiving, not merely powerful.
8. A creator's fear of public failure (especially for Hobby and Emerging Creators) is an emotional barrier to onboarding, not just a functional one.
9. Buyers conflate "the platform" with "this specific creator" — a bad experience with one creator risks damaging trust in the whole platform.
10. Review credibility depends on visible verification (proof of purchase), not just volume of reviews.
11. Gift-specific needs (notes, recipient-different-from-buyer, packaging) are core to the primary buyer persona, not an edge case.
12. Design-driven buyers browse without immediate purchase intent — discovery surfaces must support exploration, not only conversion.
13. Mobile is the dominant discovery device even when desktop is used for final purchase — flows must not assume a single-device journey.
14. Accessibility needs (screen readers, motor impairment, low vision) are not rare edge cases in aggregate — they represent a meaningful share of both buyers and creators and must be designed for by default.
15. Slow-connectivity resilience directly affects creator inclusion, not just buyer experience, since many creators operate outside high-connectivity urban centers.
16. Emotional stakes are highest at the intersection of customization and deadlines (e.g., a wedding gift needing changes close to the date) — these moments deserve the most design care.
17. Buyers' trust in a specific creator, once established, drives repeat purchase more than platform-level loyalty — the creator relationship is the retention engine.
18. Internal roles (Support, Moderator) directly shape buyer and creator trust — their tools deserve the same design rigor as customer-facing surfaces.
19. A buyer's first negative experience with delivery delay or miscommunication is disproportionately damaging given the emotional (often gift-related) context of the purchase.
20. Simplicity and guidance matter most exactly where stakes feel highest to the user — new creators and first-time/occasional buyers, not just power users, define the true usability bar.

### 14.2 Top 20 Product Insights

1. The multi-vendor, sub-order model (from `01-product-requirements.md`) must remain invisible in complexity to the buyer while being fully transparent in status.
2. Verification and curation are not just trust features — they are the core product differentiator versus Etsy and Amazon Handmade.
3. Customization is not a secondary feature layered onto commerce — for a meaningful share of demand, it is the primary reason to buy.
4. Creator tools must reduce the specific pain points of today's WhatsApp/Instagram-based workflows, not just digitize them.
5. A single account supporting both Buyer and Creator contexts (per PRD AUTH-06) reflects a real overlap in the target audience, not just a convenience feature.
6. Discovery needs both structured (search, filter, category) and unstructured (curated collections, storytelling) paths, since buyer intent varies from precise to exploratory.
7. Guest checkout is essential for the Occasional Buyer persona, who represents meaningful volume but has low platform loyalty at the outset.
8. Reviews must be gated by verified purchase to protect the authenticity promise that differentiates the platform.
9. Support and dispute flows need to account for the emotional weight of gifting-related failures, not just standard e-commerce dissatisfaction.
10. Inventory and production-capacity management is a trust mechanism as much as an operational one — overselling breaks the platform's core promise.
11. Creator onboarding friction must be weighed against the emotional vulnerability of Hobby and Emerging Creator personas — excessive barriers risk losing genuine talent before they start.
12. The platform's brand promise of curation creates an ongoing operational obligation (moderation, verification) that scales with growth — this is a structural cost of the differentiation strategy, not a one-time setup cost.
13. Messaging must be structured and order-contextual, both to reduce miscommunication and to preserve an auditable record for disputes.
14. Notification design must distinguish critical, non-optional communication (order status, security) from optional engagement content, respecting user trust.
15. Personas with low tech comfort (Occasional Buyer, Hobby Creator) reveal that "premium" design must not be conflated with "complex" — simplicity is itself a premium quality.
16. Payout transparency is a foundational trust requirement for creators, directly tied to their livelihood and the platform's "Creator Empowerment" core value.
17. The comparison matrix (Section 6) shows creators and buyers have different but overlapping needs for trust and support — internal tooling must serve both relationships simultaneously.
18. Future personas (wholesale, corporate, international) require fundamentally different purchasing mechanics — they should not be retrofitted onto the individual-gifting-optimized v2 model without deliberate redesign.
19. Accessibility and low-connectivity resilience are structural product requirements, not optional polish, given the diversity of both buyer and creator personas.
20. The emotional throughline across nearly every persona — buyer and creator alike — is a desire for their choices (to give, to make, to buy) to be recognized as meaningful, not generic; this should be treated as the product's true north star in practice, not just in the vision document.

### 14.3 Top 20 Business Insights

1. The platform's differentiation (curation, verification, premium experience) creates real, ongoing operational cost — this must be reflected in business model and staffing assumptions, not treated as purely a design choice.
2. Creator retention depends heavily on payout transparency and predictability — this is a business-critical trust mechanism, not just an accounting detail.
3. The Meaningful Gift Buyer persona's occasion-driven frequency (6–10 purchases/year) suggests seasonal demand planning is essential to both marketing and creator capacity management.
4. Conscious Shoppers and Design Collectors, while lower-frequency, show strong repeat-purchase likelihood and lower price sensitivity — they represent a high-lifetime-value segment worth deliberate retention investment.
5. Occasional Buyers, despite low loyalty and price sensitivity to friction, represent meaningful transactional volume and a key acquisition funnel — their first-experience quality disproportionately shapes word-of-mouth and reputation.
6. Hobby and Emerging Creator personas represent a supply pipeline for future Independent Artisans and Small Creative Studios — their early experience quality affects long-term supply growth, not just immediate GMV.
7. Small Creative Studios show the clearest path toward larger-scale, higher-volume sellers — supporting their operational needs well may be disproportionately important to long-term GMV growth.
8. Creator margin sensitivity (evident across all creator personas) means commission structure and coupon/discount policy require careful design to avoid eroding creator trust and retention.
9. The platform's reliance on creator-level trust (buyers return to creators, not just the platform) means creator churn has an outsized negative effect on buyer retention as well.
10. Support and moderation capacity must scale with both order volume and creator count — under-resourcing either directly threatens the trust-based differentiation strategy.
11. The emotional stakes tied to occasion-driven purchases (weddings, anniversaries, festivals) suggest seasonal reliability (fulfillment, support responsiveness) is a competitive differentiator worth explicit business investment.
12. Wholesale, corporate, and international buyer opportunities (Section 13) represent meaningful future revenue diversification but require distinct go-to-market and operational models — they should be evaluated, not assumed, as extensions of the current model.
13. Accessibility and slow-connectivity design investments expand addressable market (older adults, lower-connectivity regions) beyond the current core personas' assumptions.
14. Verification and moderation operations represent a scaling cost center that should be monitored closely as a leading indicator of required staffing investment, given growth in creator applications.
15. The platform's premium brand positioning depends on consistent execution across independently operating creators — quality control mechanisms are a business risk-mitigation investment, not just a UX concern.
16. Gift Registry, Corporate, and Wholesale opportunities each imply a different monetization and support model — business planning should treat them as distinct future initiatives rather than simple feature additions.
17. The overlap between Buyer and Creator personas (a single person can be both) suggests cross-side engagement and lifetime value opportunities that a purely one-sided marketplace model would miss.
18. Repeat-purchase likelihood is strongly tied to trust in individual creators — business strategies around retention should invest in creator-buyer relationship continuity, not only platform-level engagement tactics.
19. Design Collector and Conscious Shopper personas' willingness to pay a premium for authenticity and quality supports a business model that does not need to compete primarily on price.
20. The consistent theme of "livelihood at stake" across all creator personas means business decisions affecting creators (policy changes, fee structures, moderation actions) carry reputational and retention risk disproportionate to their immediate financial impact — these decisions warrant particular care.

---

*This document is the foundational UX reference for Dreams by Kalakaaar v2. All journey maps, wireframes, usability studies, and prioritization decisions should be evaluated against the real people, motivations, and pain points defined here.*