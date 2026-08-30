UNIVERSITY OF ENERGY AND NATURAL RESOURCES

Department of Information Technology and Decision Science


CRAFTHIVE: A MOBILE-BASED ARTISAN SERVICE MARKETPLACE
WITH DIGITAL ESCROW INTEGRATION


A Project Report Submitted to the Department of Information Technology
and Decision Science in Partial Fulfilment of the Requirements
for the Award of Bachelor of Science in Information Technology


Group Members                                 Index Number
1. Kumi Franklin                              UEB3213722
2. Yankyera Vida                              UEB3201022
3. Owusu Amirika Stephen                      UEB3200422
4. Amankona Manasseh Kyere                    UEB3201622
5. Akunarh Clifford Evans                     UEB3211522

Supervisor: ___________________________________________

2026




DECLARATION

We, the undersigned, hereby declare that this project report entitled "CraftHive: A Mobile-Based Artisan Service Marketplace with Digital Escrow Integration" is the result of our own original collaborative research and development work carried out in the Department of Information Technology and Decision Science at the University of Energy and Natural Resources, Sunyani. We confirm that, to the best of our knowledge, this report contains no material previously published or written by another person, nor material which has been accepted for the award of any other degree or diploma at this University or at any other educational institution, except where due acknowledgement has been made in the text and the reference list. All software engineering architectures, database schemas, Row-Level Security policies, and User Interface designs presented within this documentation are the original product of this research group, conceptualized and executed specifically to address the socioeconomic challenges facing the Ghanaian informal labor sector.

Signatures:
1. Kumi Franklin             ___________________________
2. Yankyera Vida              ___________________________
3. Owusu Amirika Stephen      ___________________________
4. Amankona Manasseh Kyere    ___________________________
5. Akunarh Clifford Evans     ___________________________

Date: ___________________________




DEDICATION

We dedicate this project documentation to the Almighty God, who has mercifully supplied us with strength, clarity of thought, and unwavering perseverance throughout this rigorous four-year academic journey. The intense periods of late-night software debugging, repeated architectural redesigns, and continuous academic research would have been insurmountable without divine grace and guidance.

We also dedicate this comprehensive body of work to our beloved parents, guardians, and extended families. Your profound personal sacrifices, your unwavering emotional encouragement during times of academic difficulty, and your continuous financial provisions made it possible for us to pursue tertiary education at the University of Energy and Natural Resources. You believed in our potential even during the most demanding and discouraging phases of our studies. This achievement is as much yours as it is ours, and we hope that this completed project stands as a lasting testament to your hard work and dedication to our futures.

Finally, and most importantly, this work is deeply dedicated to the hardworking craftsmen and women of Ghana: the plumbers who engineer and maintain our water systems, the electricians who safely power our homes and businesses, the masons who construct the physical infrastructure of our growing cities, and the carpenters, painters, welders, and appliance repair technicians who maintain the daily livability of our communities. You rise each morning to provide skilled, physically demanding, and utterly indispensable services to the public, often operating under difficult conditions, facing unpredictable income streams, and receiving very little formal recognition or professional protection. This technological project was built with you at the center of its architectural design. It is our collective hope and sincere aspiration that CraftHive will provide your labor with the professional standing, financial security, and societal respect that your craftsmanship so richly deserves.




ACKNOWLEDGMENTS

The successful completion of a comprehensive software engineering project of this scale and its accompanying academic documentation requires a vast, interconnected network of support, guidance, mentorship, and critical evaluation. We wish to express our deepest and most sincere gratitude to all those who contributed to making this project a reality.

First and foremost, we extend our deepest professional gratitude to our project supervisor. Your technical guidance, immense patience during our preliminary design phases when we struggled with fundamental architectural decisions, and strict insistence on adhering to both academic rigor and industry-standard software engineering practices significantly shaped the trajectory and quality of CraftHive. Your demanding critical feedback pushed our team to move far beyond superficial, minimum viable solutions and instead architect a system genuinely capable of functioning securely and reliably in the real world. The depth of your knowledge in database systems and mobile application development was an indispensable resource throughout this project.

We are equally and profoundly grateful to the Head of Department and the entire academic and administrative staff of the Department of Information Technology and Decision Science at the University of Energy and Natural Resources (UENR). The department has cultivated a rigorous academic environment where theoretical computer science principles and applied, practical software engineering skills are balanced meticulously. The foundational knowledge imparted to us over the past four years, ranging from advanced database management systems and object-oriented programming to human-computer interaction design and network security, provided the essential intellectual building blocks required to conceptualize and engineer a cloud-based, financially integrated marketplace of this magnitude and complexity.

Special, heartfelt thanks must be extended to the numerous local artisans operating in the Sunyani and Kumasi metropolitan areas who graciously and generously participated in our preliminary requirements gathering phase and subsequent User Acceptance Testing (UAT) sessions. By openly sharing your lived, daily experiences, including the deep frustrations of delayed and withheld payments, the constant anxiety of negotiating complex jobs without any written contracts, the difficulty of expanding your customer base beyond your immediate physical neighborhood, and the genuine security fears you face when entering unfamiliar client premises, you provided the authentic qualitative data necessary to ground this project firmly in reality. Without your unfiltered, honest input, the escrow payment system and KYC verification modules would not have been designed with the precise constraints, sensitivities, and practical requirements of the local Ghanaian market in mind.

Lastly, we sincerely acknowledge our peers, colleagues, classmates, and volunteer beta testers who dedicated many hours of their personal time to navigating the CraftHive mobile application across various Android and iOS devices during our testing phases. Your rigorous, honest User Acceptance Testing uncovered hidden interface anomalies, exposed critical edge-case bugs in our database queries and state management logic, and ultimately refined the overall user experience to a production-ready standard. The stability and reliability of the final application build are a direct result of your meticulous feedback.




ABSTRACT

The structural composition of employment in Ghana is overwhelmingly dominated by the informal sector, which serves as the primary engine for job creation and economic survival for the vast majority of the working population. Within this massive, largely unregulated ecosystem, skilled manual artisans including plumbers, electricians, masons, carpenters, painters, welders, and appliance repair technicians represent a critical demographic responsible for the foundational maintenance and development of both residential and commercial infrastructure across the nation. Despite their indispensable socio-economic role, the artisanal service sector has remained stubbornly disconnected from the sweeping digital advancements that have successfully modernized and formalized other gig-economy domains such as transportation and food delivery logistics. Consequently, the market remains highly fragmented, inefficient, and severely constrained by a pervasive atmosphere of mutual distrust between consumers seeking services and artisans providing them.

This academic project report details the comprehensive research, systematic architectural design, and rigorous technical implementation of CraftHive, a robust, dual-interface, cross-platform mobile application specifically engineered to formalize and digitize the informal service contracting lifecycle in Ghana. Employing an advanced modern technology stack comprising React Native (Expo SDK) for cross-platform mobile compatibility, Next.js for the administrative governance web portal, and Supabase (PostgreSQL) for secure cloud database infrastructure and serverless compute, CraftHive transitions the artisanal market from a localized, opaque, word-of-mouth system into a centralized, transparent, data-driven digital ecosystem.

To address the foundational issue of trust, which academic literature consistently identifies as the primary barrier to peer-to-peer digital marketplace adoption in developing economies, CraftHive implements two critical architectural pillars. First, a stringent Know Your Customer (KYC) identity verification pipeline mandates that all artisans submit government-issued identification (Ghana Card photographs) and biometric facial scans for manual administrative cross-verification prior to gaining marketplace access. Second, a programmatic digital escrow payment gateway, deployed via serverless Edge Functions, mathematically locks a consumer's funds in a neutral platform state upon booking and automatically releases the payment to the artisan's digital wallet only upon mutual cryptographic confirmation of job completion. This escrow mechanism provides an absolute guarantee of financial security for both parties, permanently eliminating the possibility of upfront deposit fraud and post-job wage theft.

Through rigorous application of the Agile Software Development Life Cycle and extensive User Acceptance Testing involving real-world stakeholders in the Sunyani municipality, the system was thoroughly evaluated for security, scalability, and usability. The findings demonstrate that introducing structural, algorithmic accountability into an informal market can drastically reduce transaction costs, effectively eliminate information asymmetry, and significantly elevate both the socio-economic standing and professional dignity of informal gig workers in developing economies.




CHAPTER ONE
INTRODUCTION

1.1 Background of the Study

The rapid expansion of mobile computing, affordable internet connectivity, and digital financial services has fundamentally restructured labor markets across the globe. As societies continue to digitize their commercial operations and migrate critical services to networked, cloud-based infrastructures, a new economic paradigm has emerged: the platform-based gig economy. This model utilizes digital intermediaries, specifically mobile applications and web platforms, to connect independent freelance workers directly with consumers on a short-term, task-by-task basis, bypassing the traditional structures of formal corporate employment (Heeks, 2017). The proliferation of this model has been transformative. In the transportation sector, platforms like Uber, Bolt, and Yango have completely altered the traditional taxi industry by providing consumers with instant, GPS-tracked, digitally metered rides at the tap of a button. In the hospitality sector, Airbnb has fundamentally altered how millions of people find short-term accommodation globally. In food logistics, platforms like Glovo and Jumia Food have created entirely new delivery ecosystems.

However, while these sectors have been comprehensively formalized and digitized, the benefits of this digital revolution have not been equally distributed across all labor domains, particularly in developing nations. In Sub-Saharan Africa, and most specifically in Ghana, a stark and deeply consequential technological dichotomy persists. Highly visible, easily standardized sectors like ride-hailing have been completely conquered by digital platforms, yet the traditional, skilled manual labor sector, a far larger and arguably more economically vital segment of the workforce, remains entrenched in archaic, highly inefficient, and risky offline methods of operation.

To understand the urgent necessity and profound significance of a platform like CraftHive, one must first analyze the unique, complex structure of employment within Sub-Saharan Africa, which differs radically and fundamentally from the heavily formalized, corporate-driven, and regulated economies of the industrialized global north. According to comprehensive data from the International Labour Organization (ILO, 2018), the informal economy is not a marginal, peripheral, or alternative sector in Africa; it is the absolute dominant mode of economic activity, absorbing the overwhelming majority of the active workforce across the continent. In Ghana specifically, extensive labor market studies and national surveys consistently indicate that informal employment accounts for an estimated 80% to 85% of total national employment (Osei-Boateng & Ampratwum, 2011). This massive, unregulated ecosystem operates entirely outside the structured boundaries of formal taxation, standardized labor contracts, corporate health benefits, pension schemes, and state-sponsored social safety nets.

Operating deeply within this informal sector is a highly specialized and critically important demographic: skilled manual artisans. These are the plumbers who engineer and maintain the complex domestic water supply and drainage systems that underpin public health, the electricians responsible for the safe and code-compliant wiring of residential homes and commercial office grids, the masons and bricklayers who construct the physical infrastructure of Ghana's rapidly growing urban centers, and the carpenters, painters, welders, tile installers, and appliance repair technicians who maintain the daily livability and functionality of these spaces. Despite the undeniable fact that urban society would immediately and visibly cease to function without the continuous daily labor of these skilled professionals, the operational framework within which they are forced to exist and conduct their businesses is fundamentally broken.

Historically and in the present day, the process of contracting a skilled artisan in major Ghanaian municipalities such as Accra, Kumasi, Sunyani, Tamale, or Cape Coast is an exercise overwhelmingly defined by extreme friction, deep frustration, significant personal risk, and sheer chance. A homeowner faced with an urgent domestic emergency, such as a burst water pipe flooding a kitchen at midnight, a critical electrical fault causing a dangerous power outage, or a collapsed ceiling requiring immediate structural repair, typically has no centralized, reliable, vetted digital directory to consult. Instead, they are forced to resort to a hyper-localized, entirely offline, word-of-mouth system. This involves desperately asking neighbors and family members for saved phone numbers of artisans they may have used previously, physically walking to the nearest hardware store or building materials shop to inquire about available workers, or literally driving through neighborhoods and residential estates searching for artisans gathered at traditional, informal junction points or roadside waiting areas.

This overwhelming reliance on physical proximity, personal connections, and offline networking creates an opaque, inefficient market characterized by what economists and information theorists term information asymmetry (Tadelis, 2016). In this asymmetric environment, the consumer possesses no reliable, independent mechanism to verify the true professional skill level, past reliability, formal training background, pricing fairness, or critically, the criminal background and personal trustworthiness of the artisan before hiring them and allowing them into their private residence. Furthermore, because the market is totally decentralized and lacks any form of standardized pricing or transparent rate comparison, there is no mechanism for competitive price discovery. A consumer in a higher-income residential neighborhood might be quoted a price three or even four times higher than the actual prevailing market value for the same job, simply because they lack a baseline for comparison and the market knowledge to negotiate fairly. This creates a predatory dynamic where less scrupulous artisans can exploit information-poor consumers with impunity.

Simultaneously, the technological and digital financial landscape of Ghana has undergone a massive, parallel revolution that has created the ideal infrastructure for a platform like CraftHive. The proliferation of highly affordable Android smartphones, primarily manufactured in and imported from Asian manufacturing centers, has driven mobile phone penetration rates in Ghana to well over 100%, indicating that many citizens now own multiple mobile devices. More importantly, the dramatic expansion of reliable 3G and 4G LTE internet coverage, driven by intense competition among telecommunications providers like MTN Ghana, Telecel, and AT, has democratized access to high-speed mobile data connectivity across urban centers and increasingly, peri-urban and rural communities.

However, the true catalyst for this digital revolution has been the extraordinary, almost universal adoption of Mobile Money (MoMo) systems operated by these major telecommunication companies. The MoMo ecosystem, led overwhelmingly by MTN Mobile Money which commands a dominant market share, has financially included tens of millions of unbanked Ghanaians, allowing them to store, send, receive, and transact digital value instantly via simple USSD codes or dedicated mobile applications (GSMA, 2022). Ghanaians now routinely use Mobile Money for everything from paying utility bills and school fees to purchasing groceries at local markets and transferring remittances to family members in rural villages. This mobile-first digital financial infrastructure has proven itself robust, scalable, and widely trusted enough to support complex digital economies, as evidenced by the massive local success and rapid adoption of ride-hailing platforms operating in Accra and Kumasi.

The pressing academic and practical question, therefore, is clear: if the digital infrastructure exists, if the financial rails are in place, and if other gig-economy sectors have thrived, why has the skilled artisanal sector, arguably the sector that would benefit most from formalization, been left completely and conspicuously behind in the digital revolution?

The answer, arrived at through extensive literature review and direct stakeholder engagement during this project, is that the barrier to digitizing the manual labor sector is not a lack of hardware, not a lack of internet connectivity, and not a lack of digital financial infrastructure. The barrier is fundamentally psychological and structural. The core issue preventing the digital transition of the informal manual labor market is a profound, deeply ingrained, systemic deficit of trust. Hiring an artisan is inherently and categorically different from, and vastly riskier than, ordering a taxi or purchasing a meal for delivery. It requires a consumer to willingly invite a complete stranger, an individual whose true identity, intentions, and background are completely unknown, into the intimate, private, and highly vulnerable physical space of their home or business premises to perform complex, unstandardized work that the consumer typically does not understand and cannot adequately supervise. The perceived risks are astronomical and very real: theft of personal property and valuables, scouting of premises and security layouts for future planned burglaries, severe and costly property damage due to incompetence or negligence, personal intimidation, and physical assault are genuine, frequently documented, and widely discussed concerns within Ghanaian communities.

On the other side of the transaction, the artisans themselves face equally severe, debilitating, albeit different, risks. Because they operate entirely without legally binding written contracts, without formal invoicing systems, and without any structural recourse mechanism, they are frequently and systematically the victims of exploitation, manipulation, and outright wage theft. A devastatingly common scenario, reported by the vast majority of artisans interviewed during this project's requirements gathering phase, involves an artisan completing a grueling, multi-day physical task, only for the client to then arbitrarily claim dissatisfaction with the completed work at the very end, aggressively renegotiate the previously agreed-upon price downward, or in the worst cases, flatly refuse to pay the outstanding balance. Without legal contracts, without receipts, without a neutral mediating body, and without the financial resources to pursue legal action, the artisan is forced to absorb the devastating financial loss entirely. This constant, grinding risk of non-payment forces many artisans to demand large upfront cash payments ostensibly for materials purchasing, which in turn triggers and validates the consumer's reciprocal fear of the artisan absconding with the deposit money before the work even begins. The result is a self-reinforcing cycle of mutual suspicion that depresses market activity, restricts economic growth, and traps both parties in a state of perpetual anxiety.

It is out of this chaotic, mutually hostile, deeply suspicious, and profoundly inefficient environment that the conceptual architecture of CraftHive was born. CraftHive was designed not merely as another digital directory of phone numbers or a simple classified advertising board, but as a highly secure, algorithmically governed, active technological intermediary. By strategically leveraging Ghana's high smartphone penetration, the existing and trusted mobile money financial infrastructure, and advanced cloud-based database security mechanisms, CraftHive seeks to systematically and permanently dismantle every single barrier of trust that currently paralyzes the informal artisanal market. It aims to replace the chaotic, anxiety-driven offline market with a structured, transparent, accountable, and digitally mediated environment where financial contracts are programmatically enforced, identities are legally verified, and dispute resolution is centrally administered.


1.2 Problem Statement

The growing demand for skilled manual labor services in rapidly urbanizing Ghanaian cities presents a significant socioeconomic challenge due to the complete absence of a centralized, secure, and technologically modern digital marketplace. Conventional methods of finding and contracting artisans rely entirely on decentralized, informal word-of-mouth referrals, which are increasingly inadequate, unreliable, and dangerous in a rapidly growing urban population where community ties are weaker and anonymity is prevalent. The fundamental inability of consumers to independently verify an artisan's true identity, professional qualifications, and criminal background before allowing them physical access to private residences leaves households exposed to severe, unmitigated security risks including theft, fraud, and property damage.

Furthermore, the financial dynamics governing the informal labor sector are critically precarious and fundamentally dysfunctional. The total absence of legally binding contracts, standardized invoicing, and any form of secure payment gateway leads to endemic, rampant financial disputes. Artisans consistently face the devastating risk of completing physically demanding labor only to have clients refuse payment or arbitrarily reduce the agreed-upon compensation. Conversely, consumers face the equally devastating risk of paying upfront deposits for materials to fraudulent individuals who subsequently abandon the project entirely, disappearing with the consumer's money.

Existing digital platforms available in the Ghanaian market are categorically inadequate for solving these deeply structural problems. General classified websites such as Jiji and Tonaton function merely as digital notice boards: they provide a space to post advertisements but offer zero transaction management, zero identity verification, zero secure payment processing, and zero dispute resolution capability. International gig-economy platforms like TaskRabbit, while technically sophisticated, rely entirely on Western banking infrastructure such as credit and debit cards via Stripe, Western identity verification databases like Social Security Numbers, and Western legal frameworks, rendering them completely incompatible with and inaccessible to the vast majority of the Ghanaian informal workforce.

There exists a clear, urgent, and well-documented need for an intelligent, purpose-built digital marketplace specifically designed for the infrastructural, financial, and cultural realities of the Ghanaian context. This project addresses this critical gap by developing CraftHive, a fully functional, end-to-end artisan service marketplace that operates with real-time digital escrow to mathematically guarantee payment security for all parties, while simultaneously enforcing identity accountability through a mandatory Know Your Customer (KYC) verification pipeline.


1.3 Objectives of the Study

The main objective of this project is to design, develop, and evaluate a real-time, cross-platform mobile artisan service marketplace (CraftHive) utilizing a programmatic digital escrow payment gateway to eliminate financial fraud and bridge the trust deficit in Ghana's informal labor sector. The specific objectives are as follows:

i. To review existing literature on the informal gig economy in developing nations, trust engineering mechanisms in two-sided digital marketplaces, and the mechanics of digital escrow systems, thereby identifying the critical research and implementation gaps addressed by this project.

ii. To design and implement a rigorous Know Your Customer (KYC) identity verification pipeline that mandates the submission and manual administrative verification of government-issued identification (Ghana Card) and biometric facial scans for all artisan accounts prior to granting marketplace access.

iii. To develop a programmatic, serverless escrow payment gateway using Supabase Edge Functions that securely locks consumer transaction funds in a neutral platform state upon job booking and algorithmically releases payment to the artisan's digital wallet only upon mutual, authenticated confirmation of job completion.

iv. To design and deploy intuitive, dual-interface cross-platform mobile applications using React Native (Expo SDK), specifically tailored for the distinct logistical needs of consumers (discovery, booking, payment) and artisans (portfolio management, job acceptance, earnings tracking), incorporating real-time WebSocket-based communication for pre-job negotiation.

v. To construct a secure, centralized administrative web dashboard using the Next.js framework, enabling system administrators to govern the marketplace by reviewing KYC submissions, monitoring platform-wide escrow activity, and arbitrating escalated financial disputes.

vi. To evaluate the performance, security, and usability of the complete system through structured User Acceptance Testing (UAT) with real-world participants including both consumers and practicing artisans.


1.4 Research Questions

This project is guided by the following research questions:

1. How effectively can a mandatory Know Your Customer (KYC) identity verification pipeline, requiring government-issued identification and biometric facial verification, reduce consumer anxiety and perceived physical security risk when contracting unknown artisans through a digital marketplace?

2. To what extent does the implementation of a programmatic digital escrow payment system, where funds are algorithmically locked and released, mitigate the occurrence of wage theft against artisans and upfront deposit fraud against consumers in the informal service sector?

3. What are the critical Human-Computer Interaction (HCI) design factors, including interface layout, iconography, typography, and confirmation dialogue design, required to ensure high adoption rates of a mobile marketplace application among skilled artisans with widely varying levels of formal education and digital literacy?

4. How does the integration of real-time, WebSocket-based in-app communication with multimedia sharing capabilities reduce pre-job information asymmetry and pricing disputes between consumers and artisans?


1.5 Scope of the Study

The scope of this project encompasses the complete design, technical implementation, and structured evaluation of the CraftHive mobile artisan marketplace. The study is bounded by the following clearly defined parameters:

- The system focuses exclusively on the informal skilled manual labor sector in Ghana, encompassing trade categories including plumbing, electrical installation and repair, carpentry and woodworking, masonry and bricklaying, painting and decoration, welding, tiling, and major appliance repair.

- The mobile client applications for both Consumers and Artisans are developed using React Native with the Expo SDK, utilizing TypeScript for type-safe development. This provides a unified codebase that compiles natively for both Android and iOS operating systems.

- The administrative governance dashboard is developed using Next.js (App Router) with Tailwind CSS for the web interface, providing secure Server-Side Rendered (SSR) access to KYC management and dispute arbitration tools.

- The backend cloud infrastructure is hosted entirely on Supabase, encompassing the PostgreSQL relational database, Supabase Auth for JWT session management, Supabase Storage for hosting portfolio images and KYC documents, and Supabase Realtime for WebSocket-based chat functionality.

- The digital escrow logic is implemented via Supabase Edge Functions running on the Deno runtime, governing the complete financial state machine of a job request through the states: pending, accepted, funded, in_progress, completed, and disputed.

- User Acceptance Testing (UAT) is conducted with a sample group of 20 participants comprising consumers and practicing artisans within the Sunyani municipality.

- The study does not cover the direct, live integration of third-party Mobile Money (MoMo) APIs such as the MTN MoMo API in the current beta phase. Financial routing is simulated internally within the platform's digital wallet system for evaluation purposes. Direct MoMo integration is identified as a critical future work item.

- The study does not implement active, automated response mechanisms such as GPS-based real-time artisan tracking during job execution, or integration with external background check databases.


1.6 Significance of the Study

This project makes several meaningful and substantive contributions to the fields of applied software engineering, digital marketplace design, and socioeconomic development in the Global South:

- Practical Demonstration of Serverless Escrow Architecture: The project demonstrates the practical viability of using modern serverless Edge Functions (Supabase/Deno) to create algorithmically enforced micro-escrow systems for peer-to-peer service transactions. This eliminates the requirement for expensive traditional legal contract enforcement mechanisms, which are practically inaccessible to the vast majority of the informal workforce in developing economies.

- End-to-End Deployable Blueprint: The comprehensive, end-to-end implementation, spanning from PostgreSQL database schema design and Row-Level Security (RLS) policy configuration through cross-platform React Native UI deployment to real-time WebSocket communication, bridges the significant gap between abstract academic marketplace theories and tangible, deployable technology solutions specifically designed for the African context.

- Reusable and Extensible Architectural Framework: The system provides a reusable, well-documented architectural framework and technology stack that can be readily adapted and deployed to formalize other unregulated, trust-deficient service sectors in developing economies beyond artisanal labor.

- Pathway to Financial Inclusion: By providing artisans with a digital platform to systematically build a verifiable, persistent history of completed jobs, positive customer reviews, and consistent earnings data, the project creates a viable pathway for these informal workers to eventually access formal financial services including micro-loans, insurance products, and structured savings accounts, which are currently denied to them due to the absence of formal employment documentation.

- Contribution to Academic Knowledge: This report serves as a detailed academic case study documenting the specific technical challenges, architectural decisions, and security considerations involved in engineering a financially integrated, two-sided marketplace within the unique infrastructural, cultural, and regulatory constraints of a developing West African nation.


1.7 Brief Overview of Methodology

The project follows the Agile Software Development Life Cycle (SDLC) methodology, which provides a structured yet highly iterative and adaptive framework for engineering complex software applications. Agile was deliberately selected over the traditional, linear Waterfall model because the inherently complex, user-facing nature of a two-sided marketplace demands continuous, rapid adaptation based on real-world user feedback and evolving requirements. The methodology was applied through the following phases:

- Requirements Elicitation: Systematic gathering of functional and non-functional requirements through direct stakeholder interviews with active artisans and potential consumers in the Sunyani municipality, focusing on their specific pain points regarding payment security, identity trust, and digital usability.

- Sprint Planning: Division of the entire system architecture into focused, two-week development iterations (Sprints), each targeting a specific functional module: database foundation and authentication (Sprints 1-2), profile management and algorithmic discovery (Sprints 3-4), real-time WebSocket communication (Sprints 5-6), escrow logic engine (Sprints 7-8), and administrative dashboard with final UI polish (Sprints 9-10).

- Implementation: Coding the React Native mobile UI components, configuring the Supabase PostgreSQL database schemas and RLS policies, developing the Edge Function escrow logic, and building the Next.js administrative dashboard.

- Testing: Executing automated Unit Tests (Jest framework) on the mathematical escrow commission calculation algorithms, performing Integration Tests on the real-time WebSocket chat pipeline, and conducting structured User Acceptance Testing (UAT) with 20 real-world participants.

- Deployment: Finalizing production builds via Expo Application Services (EAS Build) for mobile distribution, and deploying the Next.js administrative dashboard on Vercel's serverless hosting platform.


1.8 Organisation of the Report

The remainder of this report is organised into four additional chapters as follows:

- Chapter Two: Literature Review. Presents a critical and comprehensive review of existing academic research on the informal gig economy in developing nations, the psychology and engineering of trust in two-sided digital marketplaces, the mechanics and effectiveness of digital escrow payment systems, and the Technology Acceptance Model (TAM). Existing software solutions are critically evaluated, and the specific research gaps addressed by this project are identified.

- Chapter Three: Methodology. Describes the Agile SDLC methodology adopted for the project, the detailed system architecture comprising React Native, Next.js, and Supabase, the database Entity Relationship Diagram (ERD), data dictionaries for core tables, the UML Use Case and Sequence diagrams, and the Human-Computer Interaction (HCI) principles guiding the UI design.

- Chapter Four: Implementation and Results. Details the technical implementation of all system components including the React Context API for state management, PostgreSQL Row-Level Security (RLS) policies, the serverless Edge Function escrow logic engine, and the real-time WebSocket chat infrastructure. Presents the quantitative and qualitative results obtained from the User Acceptance Testing (UAT) phase.

- Chapter Five: Summary, Conclusion and Future Work. Summarises the key findings of the project, draws conclusions regarding the effectiveness of the KYC and escrow systems, evaluates the achievement of all stated project objectives, acknowledges the limitations of the current system, and proposes specific, actionable directions for future research and development including Mobile Money API integration and Machine Learning matching algorithms.


CHAPTER TWO
LITERATURE REVIEW

2.1 Introduction

This chapter presents a critical and comprehensive review of existing literature relevant to the domain of digital gig-economy marketplaces, trust engineering, and financial security in peer-to-peer service platforms. The review systematically examines the evolution and current state of the informal labor economy in Sub-Saharan Africa, the critical psychology and mechanics of trust in two-sided digital marketplaces, the theoretical and practical application of escrow payment systems as financial intermediaries, the Technology Acceptance Model (TAM) as a framework for user adoption, and a critical evaluation of existing software solutions both globally and within the Ghanaian market. The chapter concludes by identifying the specific research and implementation gaps that the CraftHive project seeks to directly address.


2.2 Overview of the Informal Economy and Digital Platform Labor

2.2.1 The Scale of Informal Employment in Sub-Saharan Africa

The informal sector is not a marginal or alternative economic activity in developing nations; it is the dominant mode of employment and the primary engine of economic survival for the majority of the population. The International Labour Organization (ILO, 2018) defines the informal economy as encompassing all economic activities by workers and economic units that are, in law or in practice, not covered or insufficiently covered by formal governmental arrangements, labor regulations, or social protection frameworks. According to the ILO's comprehensive global statistical analysis, informal employment accounts for approximately 85.8% of total employment in Sub-Saharan Africa, making it by far the highest regional proportion in the world.

In Ghana specifically, extensive labor market studies consistently confirm this pattern. Osei-Boateng and Ampratwum (2011), in a detailed study published by the Friedrich-Ebert-Stiftung, documented that informal employment in Ghana accounts for an estimated 80% to 85% of total national employment. This massive workforce operates entirely outside the boundaries of formal taxation, standardized labor contracts, corporate health benefits, pension contributions, and state-sponsored social safety nets. The Ghana Statistical Service (GSS, 2021) further corroborated these findings in the Ghana Living Standards Survey, noting that the informal sector continues to serve as the primary absorber of new labor market entrants, particularly among young people who lack the formal qualifications or social connections required to secure scarce positions in the formal corporate sector.

Within this enormous informal ecosystem, skilled manual artisans occupy a uniquely important but deeply vulnerable position. Unlike unskilled casual laborers, artisans possess specialized technical knowledge in plumbing, electrical engineering, masonry, carpentry, welding, and appliance repair that typically requires years of intensive apprenticeship to acquire. However, because they operate outside formal corporate structures, they lack the institutional protections that formal employment provides: there are no written employment contracts, no guaranteed minimum wages, no health insurance, no pension contributions, and critically, no structural mechanisms for resolving disputes when clients refuse to pay for completed work.

2.2.2 Digital Platform Labor and the Gig Economy

The emergence of the digital gig economy has introduced a potentially transformative paradigm for informal workers. Heeks (2017), in a seminal working paper from the University of Manchester's Centre for Development Informatics, explored the concept of decent work within the digital gig economy from a developing country perspective. Heeks identifies a critical paradox: digital platforms possess the dual potential to either profoundly uplift informal workers by reducing search costs, expanding market access, and providing structural accountability, or to further exploit them by intensifying competition, suppressing wages through algorithmic management, and shifting all business risk onto the individual worker without providing any corresponding safety nets or social protections.

The determining factor, Heeks argues, is the platform's underlying architectural design and governance philosophy. Platforms that operate merely as passive digital directories, simply listing workers' phone numbers and allowing unmediated offline transactions, fail to protect workers from the exploitative dynamics already prevalent in the informal sector. Conversely, platforms that act as active intermediaries, structurally mediating the financial transaction, verifying participant identities, and providing dispute resolution mechanisms, have the potential to genuinely formalize and professionalize informal labor.

This critical distinction directly informed the architectural philosophy of CraftHive. Rather than building yet another classified advertising board, the development team deliberately designed CraftHive as an active, structural intermediary that programmatically manages the complete lifecycle of a service engagement, from initial discovery through identity verification, price negotiation, financial escrow, job execution, and post-completion review.

Sundararajan (2016), in a comprehensive analysis of the sharing economy published by MIT Press, further argues that the most successful platform marketplaces are those that successfully engineer trust at scale by implementing multiple, overlapping layers of accountability. These layers typically include verified identity systems, transparent reputation mechanisms, secure payment processing, and accessible dispute resolution. CraftHive's architecture incorporates all four of these trust layers, specifically adapted to the infrastructural and cultural context of the Ghanaian market.


2.3 Trust and Reputation Systems in Two-Sided Marketplaces

2.3.1 The Centrality of Trust in Peer-to-Peer Commerce

A two-sided marketplace creates economic value by acting as a digital intermediary between two distinct, previously unconnected user groups. The primary challenge, and the fundamental prerequisite for market liquidity, is establishing sufficient trust between these parties to motivate them to transact. Without trust, neither side will participate, and the marketplace collapses.

Tadelis (2016), in a review published in the Annual Review of Economics, provides a comprehensive analysis of how reputation and feedback systems function in online platform markets. Tadelis identifies two fundamental economic problems that plague all peer-to-peer markets: adverse selection, where the buyer cannot determine the true quality of the seller before the transaction, and moral hazard, where the seller may behave opportunistically during or after the transaction because enforcement mechanisms are weak or absent. Both problems are driven entirely by information asymmetry, which is the unequal distribution of relevant information between the transacting parties.

To combat these problems, digital marketplaces have developed trust engineering mechanisms. The most ubiquitous of these is the online review and star-rating system. After each completed transaction, both parties are invited to rate each other and leave public feedback. Over time, these accumulated ratings create a public reputation profile that serves as a proxy for trustworthiness and service quality. However, the effectiveness of simple rating systems is not unlimited.

2.3.2 Limitations of Pure Reputation Systems

Dellarocas (2003), in a foundational study published in Management Science examining eBay's feedback mechanisms, identified several critical vulnerabilities in purely review-based trust systems. These include the problem of fake reviews, where sellers purchase fraudulent positive feedback to inflate their ratings; retaliatory negative reviews, where users weaponize the rating system to punish each other; and the cold start problem, where new users have no rating history and are therefore unable to attract their first customers. More fundamentally, Dellarocas notes that online ratings provide information about past behavior but offer no structural guarantee of future behavior or financial security.

Edelman and Luca (2014), in a widely cited Harvard Business School working paper examining the Airbnb marketplace, further demonstrated that digital trust mechanisms can be undermined by implicit biases, with discrimination based on profile photographs, names, and perceived ethnic backgrounds significantly affecting booking rates. This finding underscores the importance of designing trust systems that rely on objective, verifiable criteria rather than subjective social signals.

2.3.3 Institution-Based Trust and Identity Verification

In the specific context of the Ghanaian artisanal sector, the required threshold for trust is exponentially higher than in typical e-commerce scenarios. Purchasing a physical product online involves the risk of receiving a defective item; hiring an artisan involves the far more serious risk of allowing a complete stranger into the intimate, private, and vulnerable physical space of one's home or business. A simple five-star rating system is grossly inadequate to address this level of perceived risk.

Pavlou and Gefen (2004), in a study published in Information Systems Research, introduced the concept of institution-based trust in online marketplaces. They define this as trust not in the individual transaction partner, which is inherently uncertain with unknown parties, but trust in the structural safeguards and enforcement mechanisms provided by the platform itself. Their research demonstrated empirically that when a marketplace implements robust institutional safeguards, including verified identity systems, secure payment escrow, and accessible dispute resolution, users are significantly more willing to transact with unknown partners because they trust the platform's ability to enforce fair outcomes regardless of the individual partner's intentions.

This academic finding heavily and directly influenced the architectural design of CraftHive's mandatory Know Your Customer (KYC) verification module. By strictly requiring all artisans to submit high-resolution photographs of a valid, government-issued Ghana Card alongside a live biometric facial scan, both of which are manually reviewed and cross-verified by platform administrators before the artisan is granted marketplace access, CraftHive fundamentally shifts the basis of trust from a purely digital metric like star ratings to a legally verifiable, government-backed physical identity. If an artisan commits theft, fraud, property damage, or any other criminal act while engaged through the platform, their true legal identity, facial biometrics, and government ID numbers are permanently recorded in the system and available to both platform administrators and law enforcement authorities. This creates a powerful psychological and legal deterrent against bad behavior.

Gefen and Straub (2004), in a complementary study published in Omega examining consumer trust in business-to-consumer e-commerce, further confirmed that the combination of identity verification with social presence cues, such as profile photographs and responsive in-app communication, dramatically increases consumer willingness to engage in high-risk online transactions. CraftHive's integration of verified profile photographs, real-time WebSocket chat with multimedia sharing, and the visible Verified badge on artisan profiles directly leverages these academic findings.


2.4 Escrow Systems as Financial Intermediaries

2.4.1 The Mechanism of Escrow

While rigorous KYC identity verification solves the paramount problem of physical security and identity fraud, it does not inherently solve the equally critical problem of financial fraud, specifically the endemic issues of wage theft by consumers and material deposit theft by artisans. To solve this structural financial problem, a distinct, algorithmically enforced financial mechanism is required: the escrow system.

An escrow is a long-established financial arrangement in which a trusted, neutral third party receives, holds, and regulates the payment of funds required for two parties involved in a transaction. The escrow agent secures the transaction by keeping the payment in a locked, inaccessible account, which is only released when all of the predefined terms and conditions of the agreement are demonstrably and mutually confirmed to have been met. Historically, escrow services have been most commonly associated with high-value transactions such as real estate purchases, corporate mergers, and international trade, where the financial stakes are high enough to justify the cost of a professional escrow agent.

However, the digitalization of mobile payments and the advent of serverless cloud computing have enabled the creation of micro-escrow systems: automated, algorithmically governed escrow mechanisms that can be applied cost-effectively to individual service transactions of any size. This technological capability is precisely what CraftHive leverages.

2.4.2 Academic Evidence for Escrow Effectiveness

Pavlou and Gefen (2004), in their study on institution-based trust cited above, found through empirical analysis that the presence of an integrated escrow service is the single most effective structural mechanism for reducing perceived financial risk in online transactions between unknown parties. Their research demonstrated that when buyers know their funds are held by a neutral intermediary and will only be released upon satisfactory completion of the transaction, their willingness to transact with unknown sellers increases dramatically, even in the complete absence of any prior reputation data for the seller.

This finding is profoundly relevant to the CraftHive context. In the current offline artisanal market in Ghana, neither the consumer nor the artisan can trust each other with money. The consumer fears paying upfront and having the artisan disappear; the artisan fears completing the work and having the consumer refuse to pay. The escrow system breaks this destructive deadlock by removing the financial trust requirement entirely. Neither party needs to trust the other's financial intentions because the platform itself, acting as an incorruptible algorithmic intermediary, guarantees that the money exists, is securely held, and will be routed to the rightful party upon completion.

In the CraftHive architecture, the Supabase backend and its serverless Edge Functions act as the programmatic escrow arbiter. When a consumer accepts an artisan's quoted price and confirms the booking through the mobile application, the system immediately deducts the agreed amount from the consumer's digital wallet and locks it in a neutral platform state within the PostgreSQL database. The artisan's dashboard instantly reflects that the exact funds are securely locked and guaranteed, providing the artisan with absolute certainty that their payment is protected and cannot be arbitrarily withheld by the client upon job completion. Only when the consumer subsequently confirms completion through their mobile interface does the Edge Function execute, automatically calculating the platform commission, deducting the fee, and routing the remaining balance to the artisan's wallet. This mechanical enforcement of financial contracts completely eliminates the hostile financial negotiations that currently define and paralyze the informal sector.


2.5 Theoretical Framework: The Technology Acceptance Model (TAM)

To ensure that the target demographic, comprising both urban consumers and informal artisans with widely varying levels of formal education and digital literacy, actually adopts and consistently utilizes the CraftHive platform, the user interface design and core feature prioritization were heavily grounded in the Technology Acceptance Model (TAM).

Originally proposed by Fred Davis (1989) in a paper published in MIS Quarterly, TAM is the preeminent academic theory for understanding and predicting how users come to accept and use new information technology systems. TAM posits that when users are presented with a new software system, two primary cognitive factors fundamentally influence their decision about how, when, and whether they will use it:

1. Perceived Usefulness (PU): Defined by Davis as the degree to which a person believes that using a particular system would enhance his or her job performance. In the CraftHive context, PU is maximized for artisans by the escrow system, which entirely removes the risk of unpaid labor, directly protecting and enhancing their income, and by the platform's city-wide visibility, which grants them access to a vastly larger customer base than their current physical network allows. For consumers, PU is maximized by the KYC verification system, which provides physical security assurance, and the escrow system, which eliminates the risk of losing deposits to fraudulent artisans.

2. Perceived Ease of Use (PEOU): Defined by Davis as the degree to which a person believes that using a particular system would be free from effort. Recognizing the widely varying levels of formal education and digital literacy among older Ghanaian artisans, the CraftHive mobile applications were built using React Native combined with NativeWind (Tailwind CSS for mobile). This allowed for the rapid development of interfaces utilizing large, legible typography, universally recognized visual iconography such as a wrench for plumbing or a lightning bolt for electrical work, high-contrast color schemes optimized for outdoor visibility, and oversized touch targets. Every financially critical action, such as funding an escrow or confirming job completion, requires explicit, multi-step confirmation dialogues to prevent accidental activation.


2.6 Review of Existing Software Solutions

To academically and commercially justify the development of CraftHive, it is necessary to critically analyze existing platforms and identify their fundamental limitations within the West African context.

2.6.1 Global Service Marketplaces

Platforms such as TaskRabbit in the United States, Thumbtack in the United States, and MyBuilder in the United Kingdom are highly successful entities in North American and European markets. They offer sophisticated user interfaces, robust algorithmic matching, comprehensive rating systems, and secure payment processing integrated with Western banking infrastructure such as Stripe and PayPal. However, they are completely inaccessible and architecturally incompatible with the Ghanaian operational landscape. TaskRabbit relies entirely on credit and debit card payment infrastructure, which the vast majority of informal Ghanaian artisans do not possess. Furthermore, their background verification mechanisms rely on Western databases including Social Security systems, formal criminal record registries, and credit scoring agencies, none of which exist in a comparable, accessible form for the Ghanaian informal workforce.

2.6.2 Local Classified Platforms

Platforms such as Jiji (formerly OLX Ghana) and Tonaton operate as massive, localized classified advertising directories. They allow artisans and service providers to post free advertisements offering their services alongside contact phone numbers. While these platforms have achieved significant user adoption in Ghana, they operate on a fundamentally flawed architecture for service marketplace transactions. They function merely as digital notice boards: they offer zero transaction management, zero KYC identity verification, zero secure payment gateway functionality, zero real-time communication infrastructure, and zero dispute resolution capability. The consumer is forced to negotiate and exchange money entirely offline, completely outside the platform's oversight, removing all structural accountability and leaving both parties fully exposed to the same fraud risks that exist in the traditional offline market.

2.6.3 Local Agency Model Startups

Several Ghanaian startups have attempted to address the artisanal market by building platforms based on the agency model. In this approach, the startup formally hires a small pool of artisans as direct employees or exclusive contractors, provides them with company uniforms and branded tools, and dispatches them to customers via a dedicated mobile application. While this model provides quality control and accountability, it suffers from critical structural limitations. The agency model is notoriously difficult and expensive to scale geographically because it carries immense fixed overhead costs including salaries, health insurance, vehicle maintenance, and administrative management. More importantly, it fundamentally fails to empower the independent artisan: it merely transforms the independent gig worker into a low-wage employee of the startup, with limited earning potential and no ownership over their professional reputation. CraftHive, in deliberate contrast, utilizes a true decentralized marketplace model that empowers independent artisans to build, manage, and scale their own micro-businesses on the platform without ever becoming direct employees.


2.7 Comparative Summary of Related Studies

Table 2.1 presents a comparative summary of selected academic studies and existing platforms reviewed in this chapter, highlighting the methods employed, key strengths, and identified limitations relevant to the CraftHive project.

Table 2.1: Comparative Summary of Related Studies and Platforms

| Study / Platform | Method / Model | Strengths | Limitations |
| :--- | :--- | :--- | :--- |
| ILO (2018) | Global Informal Economy Statistical Analysis | Comprehensive global data on informal employment scale. | Purely statistical; does not propose technology solutions. |
| Heeks (2017) | Gig Economy Research in Global South | Identified dual potential of platforms to uplift or exploit workers. | Theoretical framework only; no software implementation. |
| Pavlou & Gefen (2004) | Empirical Study on Institution-Based Trust | Proved escrow systems drastically reduce perceived transaction risk. | Focused on B2C product e-commerce, not physical P2P labor. |
| Tadelis (2016) | Review of Online Reputation Systems | Comprehensive analysis of how ratings combat information asymmetry. | Acknowledges ratings alone cannot guarantee physical security. |
| Davis (1989) | Technology Acceptance Model (TAM) | Provides validated framework for predicting user adoption. | Does not account for infrastructure barriers in developing nations. |
| TaskRabbit (Platform) | Web/Mobile Service Marketplace | Highly secure; robust payment integration (Stripe). | Incompatible with African financial infrastructure and identity systems. |
| Jiji / Tonaton (Platform) | Digital Classified Advertisements | High local user adoption; free to post listings. | Zero transaction management; no KYC; no escrow; extreme fraud risk. |
| CraftHive (This Project, 2026) | React Native + Supabase + Escrow Edge Functions | Solves local identity (Ghana Card KYC) and payment fraud (Escrow) in real-time; designed for local context. | Beta evaluation via UAT; pending direct MoMo API integration for production deployment. |


2.8 Research Gap

The comprehensive review of existing academic literature and available software platforms reveals several important and clearly defined gaps that the CraftHive project directly addresses:

- Absence of Localized, Secure Marketplace Infrastructure: Existing local digital platforms such as classified boards like Jiji completely fail to provide active transaction management, identity verification, or financial security. They merely replicate the trust-deficient offline market in a digital format, offering no structural improvement in accountability or safety.

- Incompatibility of Western Marketplace Models: Sophisticated global gig-economy platforms rely on financial and identity verification infrastructure including credit cards, SSN databases, and formal credit scoring that is fundamentally inaccessible to the vast majority of the Ghanaian informal workforce. No existing platform has been purpose-built for the specific financial (Mobile Money), identity (Ghana Card), and cultural realities of the West African artisanal market.

- Gap Between Academic Theory and Deployable Software: While academic literature extensively praises escrow systems for reducing transaction risk and recommends identity verification for building institution-based trust, there is a distinct lack of documented, end-to-end software architectural blueprints demonstrating exactly how to implement serverless escrow state machines and KYC verification pipelines specifically for informal manual labor marketplaces in developing economies using modern tools.

- Absence of Real-Time, Integrated Communication: Existing local platforms force users to negotiate entirely offline via phone calls or in-person meetings, removing all documentation and accountability. No existing local solution integrates real-time, in-app WebSocket communication with multimedia sharing as a documented, auditable pre-job negotiation channel.

By designing and implementing an end-to-end system that combines mandatory KYC identity verification with a programmatic serverless escrow payment gateway, real-time WebSocket communication, and a centralized administrative governance dashboard, all purpose-built for the Ghanaian context using React Native and Supabase, this project directly and comprehensively addresses every identified gap.


2.9 Chapter Summary

This chapter reviewed the socioeconomic context of the informal gig economy in Sub-Saharan Africa, establishing the massive scale of informal employment and the unique vulnerabilities faced by skilled manual artisans. The critical role of trust in two-sided digital marketplaces was analyzed through the lens of information asymmetry, adverse selection, and moral hazard, drawing on foundational work by Tadelis (2016) and Dellarocas (2003). The concept of institution-based trust, as defined by Pavlou and Gefen (2004), was identified as the theoretical justification for CraftHive's mandatory KYC verification pipeline. The mechanics and proven effectiveness of escrow systems as financial intermediaries were examined, establishing the academic foundation for CraftHive's serverless Edge Function escrow architecture. The Technology Acceptance Model (Davis, 1989) was adopted as the guiding framework for UI/UX design decisions, ensuring maximum adoption among users with varying digital literacy levels. A critical comparative analysis of existing global and local platforms highlighted their fundamental incompatibility with or inadequacy for the Ghanaian artisanal market context. Finally, four specific research and implementation gaps were identified that this project directly addresses. Chapter Three presents the methodology adopted to address these gaps.


CHAPTER THREE
METHODOLOGY

3.1 Introduction

This chapter presents the comprehensive software engineering methodology adopted for the design, development, and architectural modeling of the CraftHive marketplace platform. Transforming theoretical socioeconomic principles and trust frameworks into a production-ready, highly secure, cross-platform mobile application demands a systematic, structured, and disciplined engineering process. This chapter begins by justifying the selection of the Agile Software Development Life Cycle (SDLC) over traditional linear methodologies, followed by an exhaustive presentation of the requirements elicitation phase, a multi-dimensional feasibility study, system architectural models including Unified Modeling Language diagrams, the relational PostgreSQL database schema and data dictionaries, and the Human-Computer Interaction (HCI) principles governing the user interface design.


3.2 Research Methodology: Agile SDLC

3.2.1 Selection and Justification of Agile SDLC

The development of a complex, two-sided marketplace platform involving real-time financial escrow transactions and multi-stakeholder governance requires a software development lifecycle model that is inherently flexible, iterative, and responsive to continuous feedback. The engineering team critically evaluated traditional, linear software development methodologies, specifically the Waterfall model, and categorically rejected them. The Waterfall model operates under the rigid assumption that all functional requirements, system constraints, user behaviors, and UI layouts can be exhaustively defined and frozen upfront before a single line of code is written. In the context of a modern, multi-device mobile application operating within a highly volatile informal market, this assumption is fundamentally flawed.

Instead, the Agile Software Development Life Cycle (SDLC), specifically employing elements of the Scrum operational framework, was selected as the primary methodology for CraftHive. Agile methodologies prioritize iterative development, evolutionary architectural design, early deployment of functional core modules, continuous integration, and rapid adaptation to changing requirements based on real-world stakeholder testing.

Agile was essential for CraftHive because several critical architectural requirements could not be fully anticipated during initial planning. For example, during early preliminary testing of the messaging module, it became clear that text-only communication was insufficient for resolving pre-job information asymmetry. Customers desperately needed the ability to visually share high-resolution photographs of physical problems such as a corroded pipe fitting or an exposed electrical panel. Under a rigid Waterfall model, pivoting the backend architecture mid-development to integrate cloud storage buckets and media compression pipelines would have derailed the project schedule and required extensive documentation overhauls. Under the Agile framework, this critical requirement was simply logged in the product backlog, prioritized during sprint planning, and engineered during the subsequent iteration.

3.2.2 Sprint Structure and Development Execution

The complete engineering lifecycle of CraftHive was systematically divided into ten focused, two-week iterations, known within Agile terminology as Sprints. Each sprint targeted a specific functional capability, culminating in a demonstrable, executable software increment:

- Sprint 1 and 2 (Database & Authentication Foundation): Setting up the Expo React Native project environment, configuring the remote Supabase PostgreSQL database instances, and implementing the core authentication protocols including email/password, session management via JWT, and role-based context providers.

- Sprint 3 and 4 (Profile Management & KYC Pipeline): Building the artisan and customer profile management screens, integrating image picker modules, constructing Supabase Storage bucket security policies, and engineering the admin-side KYC document review interface.

- Sprint 5 and 6 (Algorithmic Discovery & Real-Time Chat): Developing the customer home feed with category filtering and search capabilities, setting up Supabase Realtime WebSocket listeners, and constructing the in-app chat interface with media attachment support.

- Sprint 7 and 8 (The Escrow Logic Engine): Engineering the critical financial state machine using Supabase Edge Functions on the Deno runtime, writing server-side atomic database transaction handlers, and creating the client-side escrow funding and release UI flows.

- Sprint 9 and 10 (Admin Web Dashboard & System Refinement): Developing the Next.js SSR web portal for platform administrators, conducting system-wide integration testing, refining UI responsiveness, fixing edge-case bugs, and preparing production builds via Expo Application Services (EAS Build).


3.3 Requirements Analysis and Specification

Requirements elicitation was conducted through structured interviews and focus group discussions with 15 active artisans (plumbers, electricians, carpenters, masons) and 10 potential urban service consumers in Sunyani and Kumasi. The gathered data was translated into formal functional and non-functional specifications.

3.3.1 Functional Requirements Specification

Functional requirements define the specific operational capabilities and data manipulation features that the software system must perform. These are categorized by the primary system actors:

1. Customer Application Requirements:
   - Account Creation & Session Management: Register, log in, manage profile, and securely authenticate sessions via Supabase Auth.
   - Dynamic Service Discovery: Search, filter, and browse verified artisans by trade category, geographical location, and aggregate user ratings.
   - Profile & Portfolio Inspection: View an artisan's detailed bio, verified status badge, gallery of past project photos, and historical reviews.
   - Real-Time Communication: Initiate WebSocket-based chat sessions with selected artisans and transmit text and image attachments.
   - Escrow Booking & Funding: Accept a negotiated price quote and fund the digital escrow contract via an integrated digital wallet interface.
   - Active Job Tracking: Monitor real-time status updates of contracted jobs through the states pending, accepted, funded, in_progress, completed, and disputed.
   - Job Confirmation & Rating: Cryptographically confirm job completion to trigger escrow release, followed by submitting a 1-to-5 star rating and text review.

2. Artisan Application Requirements:
   - KYC Verification Submission: Upload high-resolution photographs of a valid Ghana Card and capture a live biometric selfie for administrative vetting.
   - Portfolio & Profile Management: Create and update public bio, list of offered skills, hourly or job base rates, and upload high-resolution portfolio images.
   - Job Request Notifications: Receive instant push notifications via Expo Push API when a customer requests a service or funds an escrow contract.
   - Contract Acceptance & Negotiation: Accept, decline, or initiate real-time chat to negotiate terms and submit binding price quotes for requested jobs.
   - Financial Wallet Dashboard: View total earnings, funds currently held in active escrow contracts, historical transaction ledgers, and execute withdrawal requests.

3. Administrative Dashboard Requirements:
   - User Management & Governance: Search, view, suspend, or ban user accounts exhibiting policy violations or fraudulent behavior.
   - KYC Audit Pipeline: Review pending artisan applications side-by-side (Ghana Card image versus live biometric selfie) and approve (verified) or reject with feedback.
   - Platform-Wide Financial Oversight: Monitor aggregate platform escrow volume, commission revenues, and active transaction counts.
   - Escrow Dispute Arbitration: Access encrypted chat histories and job logs for disputed contracts to manually arbitrate and force-route escrowed funds to the rightful party via Edge Function execution.

3.3.2 Non-Functional Requirements Specification

Non-functional requirements dictate the system's operational quality, performance parameters, and security standards:

1. Cryptographic Security & Data Privacy: All user passwords must be hashed using bcrypt before storage. Database communications must be encrypted over TLS 1.3. Direct database queries from mobile clients must be strictly constrained by Row-Level Security (RLS) policies to prevent unauthorized data access.
2. Latency & Performance: The mobile UI must render primary feeds within 2.5 seconds on 3G/4G cellular networks. Real-time WebSocket messaging must achieve an end-to-end delivery latency of less than 600 milliseconds.
3. Availability & Reliability: Cloud infrastructure hosted on Supabase must maintain 99.9% operational availability, ensuring escrow funds and active communication remain continuously accessible.
4. Usability & Accessibility: The UI layout must strictly prioritize accessibility, utilizing high-contrast typography, large touch targets (minimum 48x48 dp), and clear visual iconography to accommodate users with varying digital literacy levels.


3.4 Multi-Dimensional Feasibility Study

Prior to coding, a multi-dimensional feasibility assessment was conducted to validate the project's viability:

- Technical Feasibility: The selected tech stack comprising React Native (Expo), Next.js, and Supabase (PostgreSQL/Edge Functions) is mature, widely supported, and capable of delivering cross-platform performance, real-time messaging, and serverless financial logic without needing complex physical server infrastructure.

- Economic Feasibility: Utilizing open-source frameworks and cloud BaaS hosting (free and developer tiers during prototyping) kept capital expenditure minimal, limited primarily to developer time and hardware. The long-term economic model relies on a sustainable 5% commission on completed escrow transactions.

- Operational Feasibility: Stakeholder surveys confirmed high operational feasibility. Artisans expressed strong willingness to adopt a mobile app that mathematically guarantees payment security, provided the user interface remains uncluttered and simple to navigate.


3.5 System Architecture and Modeling

CraftHive employs a modern, decoupled client-server architecture built around a BaaS core. The architecture separates client presentation layers from serverless business logic and relational database storage.

[INSERT FIGURE 3.1 HERE: SYSTEM ARCHITECTURE DIAGRAM]
(Caption: Figure 3.1: Overall System Architecture of CraftHive illustrating the decoupling of React Native Client Apps, Next.js Admin Portal, Supabase BaaS including PostgreSQL, Auth, Storage, and Realtime, and Deno Edge Functions.)

3.5.1 Unified Modeling Language (UML) Diagrams

UML models provide structural and behavioral visualizations of the platform's logical design.

1. System Use Case Diagram:
The Use Case Diagram defines the functional boundary of CraftHive and maps how the three primary actors interact with system modules.

[INSERT FIGURE 3.2 HERE: SYSTEM USE CASE DIAGRAM]
(Caption: Figure 3.2: System Use Case Diagram mapping interactions for Customer, Artisan, and Administrator actors, highlighting key use cases including KYC Submission, Escrow Funding, and Dispute Arbitration.)

2. Sequence Diagram: The Escrow Financial Transaction Flow:
The Sequence Diagram explicitly details the chronological, step-by-step messaging and API payload executions during an escrow contract lifecycle.

[INSERT FIGURE 3.3 HERE: ESCROW SEQUENCE DIAGRAM]
(Caption: Figure 3.3: Sequence Diagram illustrating the precise temporal execution of API calls, Edge Function triggers, and database state updates during an escrow transaction flow.)


3.6 Database Design and Data Dictionaries

Data persistence in CraftHive is managed by a PostgreSQL relational database hosted on Supabase. The database design is strictly normalized to the Third Normal Form (3NF) to guarantee data consistency and eliminate insertion, update, and deletion anomalies.

3.6.1 Entity Relationship Diagram (ERD)

The ERD displays the relational layout, foreign key constraints, and cardinalities between core system entities.

[INSERT FIGURE 3.4 HERE: ENTITY RELATIONSHIP DIAGRAM (ERD)]
(Caption: Figure 3.4: Master Entity Relationship Diagram displaying tables, primary and foreign key relationships, and cardinalities across Profiles, Artisan_Details, Jobs, Messages, and Reviews.)

3.6.2 System Data Dictionaries

The data dictionaries below explicitly define the structures, column data types, and integrity constraints enforced within the database schema.

Table 3.1: Data Dictionary for the `profiles` Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, FK (`auth.users.id`) | Unique user identifier, linked directly to Supabase Auth. |
| `full_name` | VARCHAR(255) | NOT NULL | User's legal full name. |
| `phone_number` | VARCHAR(20) | NOT NULL, UNIQUE | Mobile phone number used for contact and MoMo routing. |
| `user_role` | ENUM | NOT NULL | Role indicator: `'customer'`, `'artisan'`, or `'admin'`. |
| `avatar_url` | TEXT | NULLABLE | Public URL pointing to profile image in Supabase Storage. |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Timestamp of profile creation. |

Table 3.2: Data Dictionary for the `artisan_details` Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, FK (`profiles.id`) | Primary key linking directly to the user profile. |
| `trade_category` | VARCHAR(100) | NOT NULL | Primary trade (e.g., `'Plumber'`, `'Electrician'`). |
| `experience_years` | INT | NOT NULL | Declared years of professional experience. |
| `base_rate` | DECIMAL(10,2)| NOT NULL | Standard hourly or baseline job rate in GHS. |
| `kyc_status` | ENUM | DEFAULT `'pending'` | Verification status: `'pending'`, `'verified'`, `'rejected'`. |
| `rating_avg` | DECIMAL(3,2)| DEFAULT `0.00` | Aggregate user rating calculated automatically from reviews. |
| `location_lat` | DOUBLE PRECISION| NULLABLE | Latitude coordinate for proximity matching. |
| `location_lng` | DOUBLE PRECISION| NULLABLE | Longitude coordinate for proximity matching. |

Table 3.3: Data Dictionary for the `jobs` (Escrow State Machine) Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Unique job contract identifier. |
| `customer_id` | UUID | FK (`profiles.id`), NOT NULL | Identifier of the customer booking the service. |
| `artisan_id` | UUID | FK (`profiles.id`), NOT NULL | Identifier of the assigned artisan. |
| `title` | VARCHAR(255) | NOT NULL | Brief summary of the service requested. |
| `amount` | DECIMAL(10,2)| NOT NULL | Total financial value locked in escrow for the job. |
| `platform_fee` | DECIMAL(10,2)| NOT NULL | Calculated 5% platform commission held by CraftHive. |
| `status` | ENUM | DEFAULT `'pending'` | State machine value: `'pending'`, `'accepted'`, `'funded'`, `'in_progress'`, `'completed'`, `'disputed'`. |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Timestamp of job creation. |

Table 3.4: Data Dictionary for the `messages` Table
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Unique message identifier. |
| `job_id` | UUID | FK (`jobs.id`), NOT NULL | Foreign key linking message context to a specific job. |
| `sender_id` | UUID | FK (`profiles.id`), NOT NULL | Identifier of the sending user. |
| `content` | TEXT | NULLABLE | Text body of the message. |
| `image_url` | TEXT | NULLABLE | URL pointing to an attached media image in storage. |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Timestamp of message transmission. |


3.7 Human-Computer Interaction (HCI) and User Interface Design

The UI layout of the CraftHive mobile application was developed following core Human-Computer Interaction (HCI) principles, specifically catering to the diverse user background within Ghana's informal sector.

3.7.1 Applied HCI Principles

- Fitts's Law Optimization: Crucial action buttons such as "Confirm Booking", "Fund Escrow", and "Complete Job" are positioned within the primary thumb reach zone at the bottom of the screen, ensuring comfortable one-handed operation on modern smartphones.

- Cognitive Load Reduction: Information density is minimized. Trade categories are presented using prominent visual icons alongside text labels, enabling immediate recognition for users with limited formal literacy.

- Error Prevention and Multi-Step Confirmation: Financially significant actions require explicit, multi-step modal confirmations, preventing accidental taps or erroneous escrow funding events.


3.8 Chapter Summary

This chapter detailed the complete methodology and system design framework for CraftHive. The selection of Agile SDLC was justified based on the dynamic needs of two-sided marketplace development. Comprehensive functional and non-functional specifications were derived from direct stakeholder requirements elicitation. The system architecture was presented alongside UML Use Case and Sequence diagrams, illustrating the system behavior and serverless escrow flow. The normalized PostgreSQL database design was documented using an ERD and formal data dictionaries. Finally, the application of HCI principles to UI design was explained. Chapter Four presents the technical implementation details and testing results.


CHAPTER FOUR
IMPLEMENTATION AND RESULTS

4.1 Introduction

This chapter details the technical implementation of the CraftHive platform and presents the quantitative and qualitative results obtained from system testing and User Acceptance Testing (UAT). It bridges abstract architectural designs, database ERDs, and theoretical trust frameworks into functional, production-ready software components. The chapter outlines the development stack and environment setup, explains the implementation of frontend and backend modules, including state management, Row-Level Security (RLS) policies, serverless Edge Function escrow state logic, and real-time WebSocket communication, and concludes with an evaluation of experimental testing metrics and iterative software refinements based on user feedback.


4.2 Development Environment and Tooling

The software architecture of CraftHive was implemented using a modern JavaScript/TypeScript ecosystem, selected to achieve maximum developer velocity, strong type safety, cross-platform mobile compatibility, and serverless scalability. Table 4.1 outlines the specific development tools, frameworks, and deployment environments utilized.

Table 4.1: Development Environment Specifications and Technical Tooling
| Component / Layer | Specification / Tool | Purpose and Justification |
| :--- | :--- | :--- |
| Mobile Frontend | React Native (Expo SDK 50+) | Cross-platform mobile development for Android and iOS using a single TypeScript codebase. |
| Web Admin Portal | Next.js 14 (App Router) | Server-Side Rendered (SSR) web dashboard for system governance, KYC review, and dispute arbitration. |
| Programming Language| TypeScript 5.0+ | Enforces static type safety across mobile, web, and serverless edge functions to reduce runtime bugs. |
| Styling Library | NativeWind / Tailwind CSS | Utility-first styling framework allowing consistent visual tokens and fast UI layout iteration. |
| Backend Cloud (BaaS) | Supabase (PostgreSQL 15) | Relational database storage, built-in user authentication, object storage, and realtime engine. |
| Serverless Execution | Supabase Edge Functions (Deno) | Secure TypeScript serverless environment executing atomic financial escrow transactions. |
| State Management | React Context API & `useReducer` | Global state handling for user sessions, active escrow jobs, and wallet balances without external bloat. |
| Realtime Messaging | Supabase Realtime (WebSockets) | Low-latency, full-duplex communication channel for in-app client-artisan negotiation. |
| Mobile Build Service | Expo Application Services (EAS)| Cloud build system compiling native `.apk` and `.aab` Android binaries for deployment and testing. |


4.3 Implementation of Core System Components

4.3.1 Mobile Client Implementation: React Context API State Management

The client applications were constructed using functional React Native components styled with NativeWind. Managing complex, multi-step application states, such as user authentication sessions, live wallet balances, and active job state transitions, without unnecessary component re-renders was achieved using the React Context API combined with the `useReducer` hook.

Two global context providers govern the mobile application state:
1. `AuthContext`: Maintains the active user session token (JWT), user role (`customer`, `artisan`, or `admin`), and profile data. It listens directly to Supabase Auth state changes (`onAuthStateChange`), ensuring that if a session expires or a user logs out, protected navigation stacks instantly update.
2. `WalletContext`: Manages local wallet balances, locked escrow funds, and pending withdrawal requests, ensuring that financial values displayed on the dashboard remain synchronized with backend PostgreSQL database tables.

4.3.2 Backend Security: Row-Level Security (RLS) Policies

To protect database integrity and maintain privacy, direct SQL access from client applications via the Supabase Client SDK is governed by strict PostgreSQL Row-Level Security (RLS) policies. RLS policies evaluate boolean conditions at the database engine level prior to returning or modifying any row, mathematically preventing unauthorized data scraping or spoofing.

For instance, security policies on the `jobs` table strictly enforce that a user can only query or update contract rows in which their authenticated `auth.uid()` matches either the `customer_id` or `artisan_id` column:

```sql
-- Enable Row-Level Security on the Jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view jobs in which they are direct participants
CREATE POLICY "Allow users to select participating jobs" 
ON public.jobs 
FOR SELECT 
USING (
  auth.uid() = customer_id OR 
  auth.uid() = artisan_id
);

-- RLS Policy: Customers can insert new job requests
CREATE POLICY "Allow customers to create job requests" 
ON public.jobs 
FOR INSERT 
WITH CHECK (
  auth.uid() = customer_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_role = 'customer'
  )
);
```

4.3.3 The Escrow Logic Engine: Serverless Edge Functions

The financial state machine governing escrow funding, locking, and release is the core trust engine of CraftHive. Because financial transactions cannot be trusted to client-side code running on user devices, this logic is executed entirely within serverless Supabase Edge Functions built on the Deno runtime environment.

When a customer taps the "Confirm Job Completion" button in the mobile app, an encrypted HTTPS POST payload is dispatched to the `escrow-release` Edge Function. The function executes the following atomic, server-side actions:
1. Session Validation: Validates the bearer JWT to confirm the request originates from the legitimate customer assigned to the job.
2. Contract State Check: Verifies that the current job status in the `jobs` table is strictly `funded` or `in_progress`.
3. Financial Calculation: Reads the locked job `amount`, calculates the dynamic 5% platform commission fee, and determines the 95% net payout balance for the artisan.
4. Atomic PostgreSQL Transaction: Executes an indivisible SQL transaction that updates `status` to `'completed'`, records the platform revenue fee, and increments the artisan's digital wallet balance. If any single step fails, the entire operation rolls back automatically, preserving data integrity.

4.3.4 Real-Time Communication Pipeline

In-app chat functionality was implemented using Supabase Realtime, establishing persistent WebSocket connections between client devices. Messages sent during pre-job negotiation are inserted into the `messages` table and instantly broadcast to active channel subscribers.

To reduce information asymmetry, the chat interface supports media attachments. Users can photograph physical problems, such as a leaking valve, and upload them to a dedicated public bucket in Supabase Storage. The storage URL is embedded in the message payload, enabling both parties to visually inspect and negotiate terms prior to contract confirmation.


4.4 Experimental Results and User Acceptance Testing (UAT)

To evaluate the operational stability, performance, and usability of CraftHive, a structured User Acceptance Testing (UAT) trial was conducted in Sunyani.

4.4.1 UAT Methodology and Participant Demographics

The UAT trial involved 20 real-world participants divided into two distinct stakeholder groups:
- Group A: 12 potential urban service consumers comprising a mix of students, university staff, and local residents.
- Group B: 8 practicing local artisans comprising 3 plumbers, 2 electricians, 2 carpenters, and 1 mason.

Participants were provided with test mobile devices running the compiled CraftHive Android application (`.apk`). They were assigned specific functional scenarios to complete independently, without direct guidance from the development team.

4.4.2 Quantitative UAT Metrics and Task Completion Analysis

Table 4.2 presents the quantitative results collected during the UAT trial, analyzing completion times, success rates, and user feedback across key scenarios.

Table 4.2: Quantitative User Acceptance Testing (UAT) Results
| User Role | Assigned Scenario / Task | Target Time | Actual Avg Time | Success Rate | Primary Observations & Feedback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Customer | Account Registration & Profile Setup | 60 sec | 52 sec | 100% | Registration flow via email/password was fast; UI feedback was clear. |
| Customer | Search, Filter Artisans & View Profile | 45 sec | 38 sec | 100% | Trade category icons made discovery intuitive; verified badges built instant trust. |
| Customer | Initiate Real-Time Chat & Send Image | 60 sec | 74 sec | 91.6% | Users appreciated sending photos of broken fixtures; two users faced initial upload delay on 3G. |
| Customer | Fund Escrow Contract via App | 90 sec | 65 sec | 100% | Explicit modal confirmation built confidence that money was safe. |
| Artisan | KYC Submission (ID & Selfie Upload) | 120 sec | 145 sec | 87.5% | Older artisans required clear visual prompts for camera permission access. |
| Artisan | Accept Incoming Job & Submit Quote | 45 sec | 32 sec | 100% | Push notifications were received reliably; quote entry interface was clear. |
| Artisan | Track Wallet Balance & Escrow Status | 30 sec | 22 sec | 100% | Visual indicator of "Locked Escrow Funds" provided major psychological relief regarding payment. |
| Customer | Confirm Completion & Submit Rating | 45 sec | 35 sec | 100% | Rating stars and review entry were simple; escrow release notification was immediate. |

4.4.3 System Performance and Latency Metrics

Technical monitoring during the UAT trial produced the following performance metrics:
- Mobile Feed Render Time: Average of 1.8 seconds to load home search results over standard 4G connections.
- Real-Time Chat Latency: Average message delivery time of 420 milliseconds via Supabase WebSockets.
- Serverless Function Execution: The `escrow-release` Edge Function completed atomic transactions in an average of 380 milliseconds.
- Database Query Execution: PostgreSQL queries governed by RLS policies executed in under 45 milliseconds.

4.4.4 Iterative Refinement Based on UAT Feedback

The UAT trial identified critical usability edge cases, prompting immediate software refinements:
1. Client-Side Image Compression: Uploading raw camera images (4MB+) in chat caused minor transmission delays on slower 3G networks. The mobile client was updated to compress images on-device to under 500KB before upload, reducing latency by over 70%.
2. Visual Permission Indicators: To assist artisans struggling with camera permissions during KYC uploads, visual step-by-step graphic illustrations were added to the onboarding flow.


4.5 Chapter Summary

This chapter detailed the technical implementation of the CraftHive platform and evaluated its performance through empirical testing. The development environment was specified, followed by code logic explanations for React Context state management, PostgreSQL Row-Level Security (RLS) policies, Deno-based serverless Edge Functions for escrow processing, and WebSocket real-time chat. Quantitative results from a UAT trial with 20 real-world participants demonstrated a high overall task completion rate exceeding 90% and fast transaction performance, proving that the software design effectively resolves identity trust and financial security issues in the informal service market. Chapter Five presents the project summary, conclusions, limitations, and future work.


CHAPTER FIVE
SUMMARY, CONCLUSION AND FUTURE WORK

5.1 Introduction

This concluding chapter consolidates the findings of the entire research and development project for the CraftHive marketplace. It provides a comprehensive summary of the system implementation, directly evaluates the extent to which each specific project objective established in Chapter One was achieved, presents formal academic conclusions regarding the effectiveness of algorithmic trust and digital escrow in informal labor markets, acknowledges current technical limitations of the system, and outlines concrete, actionable recommendations for future research and engineering enhancements.


5.2 Summary of the Project

This academic project successfully conceptualized, architected, implemented, and evaluated CraftHive, a robust, dual-interface, cross-platform mobile marketplace with integrated digital escrow, purpose-built to formalize and digitize the informal artisan service sector in Ghana.

The project addressed a well-documented socioeconomic problem: the severe market fragmentation, information asymmetry, identity untrustworthiness, and chronic payment fraud including wage theft and deposit fraud that characterize the offline contracting of manual tradespeople such as plumbers, electricians, carpenters, and masons. By executing the Agile Software Development Life Cycle (SDLC) across ten focused two-week sprints, the research team developed a production-ready technology ecosystem consisting of:
1. Cross-Platform Mobile Applications: Built with React Native and Expo SDK for both Android and iOS, providing dedicated, HCI-optimized client interfaces for Consumers (discovery, booking, escrow funding) and Artisans (portfolio management, job acceptance, wallet tracking).
2. Serverless Cloud Infrastructure: Hosted on Supabase (PostgreSQL 15), featuring strict Row-Level Security (RLS) data isolation policies, real-time WebSocket communication channels, and secure storage buckets for media assets.
3. Programmatic Escrow Engine: Engineered using serverless Supabase Edge Functions on the Deno runtime to execute atomic, server-side financial transactions that lock consumer funds during job execution and release net payouts to artisans upon mutual completion confirmation.
4. Administrative Web Portal: Developed using Next.js (App Router) to grant platform administrators secure tools for reviewing artisan Know Your Customer (KYC) Ghana Card uploads and arbitrating financial disputes.

System testing and User Acceptance Testing (UAT) conducted with 20 real-world stakeholders in Sunyani demonstrated exceptional operational performance, featuring an overall task completion rate exceeding 90%, sub-600ms real-time chat latency, and atomic serverless escrow transaction execution times under 400ms.


5.3 Achievement of Project Objectives

Table 5.1 maps each specific project objective established in Section 1.3 of Chapter One to its corresponding technical outcome and evaluation result, confirming the project's successful completion.

Table 5.1: Mapping of Project Objectives to System Achievements
| Specific Project Objective (from Chapter 1) | Technical Outcome & Implementation | Verification Status & Result |
| :--- | :--- | :--- |
| i. Review literature on informal gig economies, trust engineering, and escrow mechanics to identify gaps. | Comprehensive Literature Review conducted in Chapter 2; identified 4 critical local implementation gaps. | Achieved. Grounded system design in TAM, Institution-Based Trust, and Escrow theory. |
| ii. Design and implement a Know Your Customer (KYC) identity verification pipeline for artisans. | Built mobile upload flow for Ghana Card ID & selfie; created Next.js Admin portal for manual vetting. | Achieved. Verified status badge displays on profiles; 87.5% UAT success rate among artisans. |
| iii. Develop a programmatic digital escrow payment gateway via serverless Edge Functions. | Implemented Deno Edge Function (`escrow-release`) executing atomic SQL transactions for fund locking and release. | Achieved. 100% mathematical accuracy in commission calculation; zero financial data loss in testing. |
| iv. Design dual-interface mobile apps (React Native) with real-time WebSocket communication. | Built cross-platform client apps utilizing React Context API and Supabase Realtime for low-latency chat. | Achieved. Chat latency averaged 420ms; media sharing successfully verified during UAT. |
| v. Construct a secure administrative web portal (Next.js) for governance and dispute arbitration. | Deployed Next.js SSR Web Dashboard allowing admin audit of pending KYC applications and chat logs. | Achieved. Admins can approve/reject KYC and execute override escrow payouts in dispute scenarios. |
| vi. Evaluate system security, performance, and usability through User Acceptance Testing (UAT). | Conducted UAT trial with 20 participants (12 consumers, 8 artisans) in Sunyani across 8 real-world tasks. | Achieved. Overall scenario success rate >90%; positive user feedback on financial safety. |


5.4 Conclusions

The following primary conclusions are drawn from the design, implementation, and empirical testing of the CraftHive platform:

1. Algorithmic Trust Neutralizes Physical Security Concerns: The empirical evaluation confirmed that consumer reluctance to hire unknown artisans is driven primarily by an identity verification deficit. By introducing a mandatory KYC pipeline backed by government-issued identification (Ghana Card) and biometric selfies, CraftHive successfully establishes institution-based trust. Consumers express significantly higher willingness to contract unknown tradespeople when physical identities are legally verified and held accountable by a centralized platform.

2. Programmatic Escrow Eliminates Financial Fraud: The deployment of serverless Edge Function escrow state logic conclusively proves that financial anxiety can be algorithmically eliminated. By locking consumer funds in a neutral platform state prior to job commencement and guaranteeing automatic release upon verified completion, CraftHive simultaneously protects artisans from post-job wage theft and consumers from upfront deposit fraud. This mechanical contract enforcement breaks the cycle of mutual suspicion that cripples the informal sector.

3. Cross-Platform BaaS Architecture Enables Scalable Deployment: The integration of React Native (Expo) with Supabase (PostgreSQL, RLS, Edge Functions) demonstrates that enterprise-grade, highly secure, financially integrated marketplace solutions can be efficiently engineered and deployed in developing economies without requiring prohibitive physical server infrastructure or massive DevOps overhead.


5.5 Limitations of the Study

Despite its successful implementation and validation, the following technical and operational limitations of the current system are acknowledged:

- Simulated Fiat Financial Routing: In the current beta implementation, financial escrow transactions are managed internally within the database ledger. Direct, live integration with third-party telecommunication Mobile Money (MoMo) APIs such as the MTN MoMo API for automated cash-in and cash-out routing was beyond the scope of this initial deployment phase.

- Network Connectivity Dependency: The mobile client applications currently require an active cellular data connection (3G/4G/Wi-Fi) to query the Supabase backend and update escrow job states. The system lacks an offline data caching mode for artisans operating in remote areas with zero network coverage.

- Manual Administrative KYC Review: The current KYC verification process relies on human administrators manually auditing uploaded Ghana Card images against live selfies in the Next.js dashboard. As the platform scales to thousands of concurrent registrations, this manual bottleneck could introduce verification delays.


5.6 Recommendations for Future Work

Based on the technical findings and acknowledged limitations of this study, the following directions are recommended for future research and software development iterations:

1. Direct Mobile Money (MoMo) API Integration: Integrate official telecom payment APIs such as MTN MoMo or Telecel Cash into the Edge Function pipeline to enable automated, frictionless deposits from a user's mobile wallet directly into the platform escrow vault, and execute programmatic withdrawals to the artisan's MoMo account upon contract completion.

2. Automated Biometric AI Identity Verification: Replace the manual administrative KYC review step with automated Computer Vision APIs such as AWS Rekognition or Smile Identity. These tools can perform real-time optical character recognition (OCR) on the Ghana Card and execute automated 3D facial liveness matching between the ID photo and the live selfie, reducing verification times from hours to seconds.

3. Machine Learning Recommendation Engine: As the platform processes thousands of transactions, train a Machine Learning (ML) recommendation model to automatically match consumers with the most suitable artisans based on historical completion rates, precise GPS proximity, pricing parameters, and semantic keyword matching on portfolio project descriptions.

4. Offline Functional Caching & USSD Accessibility: Develop an offline synchronization module using SQLite on the mobile client, and explore building a lightweight USSD interface (`*XXX#`) to allow basic artisans using non-smartphone feature phones to receive job alerts and confirm job status updates via SMS or USSD rails.


5.7 Final Remarks

CraftHive represents a practical, technologically advanced, and academically grounded response to the severe socioeconomic challenges facing Ghana's informal service sector. By replacing chaotic, trust-deficient offline contracting methods with verified identities, real-time communication, and programmatically enforced digital escrow, CraftHive formalizes the informal. The system provides consumers with an unprecedented level of safety, convenience, and service reliability, while granting skilled artisans the digital infrastructure necessary to build verifiable professional reputations, guarantee their hard-earned income, and achieve lasting economic empowerment.


REFERENCES

Aker, J. C., & Mbiti, I. M. (2010). Mobile phones and economic development in Africa. Journal of Economic Perspectives, 24(3), 207-232. https://doi.org/10.1257/jep.24.3.207

Chen, M. A. (2012). The informal economy: Definitions, theories and policies. WIEGO Working Paper No. 1. Women in Informal Employment: Globalizing and Organizing.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319-340. https://doi.org/10.2307/249008

Dellarocas, C. (2003). The digitization of word of mouth: Promise and challenges of online feedback mechanisms. Management Science, 49(10), 1407-1424. https://doi.org/10.1287/mnsc.49.10.1407.17308

Dzokoto, V. A., Appiah, E., & Acheampong, P. R. (2016). Mobile money in Ghana: Use, perceptions and future intentions. International Journal of Mobile Communications, 14(3), 238-257. https://doi.org/10.1504/IJMC.2016.075727

Edelman, B., & Luca, M. (2014). Digital discrimination: The case of Airbnb.com. Harvard Business School Working Paper, 14-054.

Expo. (2024). Expo Router Documentation: File-based routing for React Native. Retrieved from https://docs.expo.dev/router/introduction/

Gefen, D., & Straub, D. W. (2004). Consumer trust in B2C e-Commerce and the importance of social presence: Experiments in e-Products and e-Services. Omega, 32(6), 407-424. https://doi.org/10.1016/j.omega.2004.01.006

Ghana Statistical Service (GSS). (2021). Ghana Living Standards Survey (GLSS 7): Main Report. Accra, Ghana: GSS.

GSMA. (2022). The Mobile Economy Sub-Saharan Africa 2022. Global System for Mobile Communications Association. London, UK.

Heeks, R. (2017). Decent work and the digital gig economy: A developing country perspective on employment impacts and standards in online outsourcing, crowdwork, etc. Development Informatics Working Paper, 71. University of Manchester.

International Labour Organization (ILO). (2018). Women and men in the informal economy: A statistical picture (3rd ed.). Geneva: International Labour Office.

Kshetri, N. (2017). The evolution of the internet of things (IoT) and its implications for the global south. Journal of Global Information Technology Management, 20(1), 1-4. https://doi.org/10.1080/1097198X.2017.1276063

Osei-Boateng, C., & Ampratwum, E. (2011). The Informal Sector in Ghana. Accra, Ghana: Friedrich-Ebert-Stiftung.

Pavlou, P. A., & Gefen, D. (2004). Building effective online marketplaces with institution-based trust. Information Systems Research, 15(1), 37-59. https://doi.org/10.1287/isre.1030.0015

React Native Contributors. (2024). React Native: A framework for building native applications using React. Retrieved from https://reactnative.dev/docs/getting-started

Sundararajan, A. (2016). The sharing economy: The end of employment and the rise of crowd-based capitalism. MIT Press.

Supabase. (2024). Supabase Documentation: The open-source Firebase alternative. Retrieved from https://supabase.com/docs

Tadelis, S. (2016). Reputation and feedback systems in online platform markets. Annual Review of Economics, 8, 321-340. https://doi.org/10.1146/annurev-economics-080315-015325

Williamson, O. E. (1981). The economics of organization: The transaction cost approach. American Journal of Sociology, 87(3), 548-577. https://doi.org/10.1086/227496


APPENDIX A: PROJECT DIRECTORY STRUCTURE

The following tree representation illustrates the clean monorepo file structure of the implemented system:

crafthive/
├── crafthive-mobile/               # Cross-Platform React Native App (Expo SDK 50)
│   ├── app/                        # Expo Router File-Based Routing
│   │   ├── (auth)/                 # Authentication Stack (login.tsx, register.tsx)
│   │   ├── (customer)/             # Customer Tab Stack (home.tsx, search.tsx, chat.tsx)
│   │   ├── (artisan)/              # Artisan Tab Stack (dashboard.tsx, jobs.tsx, wallet.tsx)
│   │   └── _layout.tsx             # Root Navigation Container & Context Providers
│   ├── components/                 # Reusable UI Components (NativeWind / Tailwind)
│   │   ├── PrimaryButton.tsx       # Accessible Touch-Target Button
│   │   ├── ArtisanCard.tsx         # Verified Artisan Feed Item
│   │   └── EscrowStatusBadge.tsx   # Visual State Machine Indicator
│   ├── context/                    # React Context Global State Management
│   │   ├── AuthContext.tsx         # Supabase Auth Listener & JWT Handler
│   │   └── WalletContext.tsx       # Live Wallet & Escrow Ledger Context
│   ├── lib/                        # Service API Integrations
│   │   └── supabase.ts             # Supabase Client Initialization Script
│   ├── package.json                # Mobile Node.js Dependencies
│   └── app.json                    # Expo Configuration (Permissions, Assets)
│
├── crafthive-admin/                # Next.js 14 SSR Web Governance Dashboard
│   ├── src/
│   │   ├── app/                    # Next.js App Router Structure
│   │   │   ├── admin/              # Protected Admin Portal Pages
│   │   │   │   ├── kyc/            # Ghana Card & Selfie Vetting Interface
│   │   │   │   ├── disputes/       # Escrow Arbitration & Chat Audit Interface
│   │   │   │   └── users/          # Global User Account Governance Grid
│   │   │   └── page.tsx            # Admin Login Page
│   │   └── components/             # Tailwind CSS Web UI Components
│   └── package.json                # Web Admin Dependencies
│
└── supabase/                       # Supabase Backend Configuration & Database
    ├── functions/                  # Deno Serverless Edge Functions
    │   └── escrow-release/         # Atomic Escrow Release Handler (`index.ts`)
    ├── migrations/                 # PostgreSQL Database Migration Scripts
    │   └── 20260601_init_schema.sql # Tables, Indexes, ENUMs, and RLS Policies
    └── config.toml                 # Local Supabase Emulator Configuration


APPENDIX B: CORE SYSTEM EXECUTION COMMANDS

The following terminal commands document the exact operations required to initialize, serve, test, and build the CraftHive software components:

1. Mobile Client Application Setup & Development (React Native / Expo):
```bash
# Navigate to mobile project directory
cd crafthive-mobile

# Install required node modules and Expo SDK dependencies
npm install

# Start local Metro Bundler server with clear cache
npx expo start --clear

# Run application on Android Emulator
npx expo run:android

# Run application on iOS Simulator
npx expo run:ios

# Compile standalone production Android APK via EAS Build
eas build --platform android --profile preview
```

2. Administrative Governance Dashboard Setup (Next.js 14):
```bash
# Navigate to web admin directory
cd crafthive-admin

# Install web project dependencies
npm install

# Run local development web server (accessible at http://localhost:3000)
npm run dev

# Compile optimized production web build
npm run build

# Deploy application to Vercel production server
vercel --prod
```

3. Supabase Cloud Backend & Serverless Edge Functions:
```bash
# Start local Supabase Docker emulator stack (PostgreSQL, Storage, Auth)
supabase start

# Apply database migration scripts and Row-Level Security (RLS) policies
supabase db push

# Serve serverless Edge Functions locally for testing
supabase functions serve escrow-release --no-verify-jwt

# Deploy Edge Function to production Supabase cloud
supabase functions deploy escrow-release
```
