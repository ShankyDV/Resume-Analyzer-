export interface SampleResumePreset {
  id: string;
  name: string;
  role: string;
  experience: string;
  companyType: 'faang' | 'tier2' | 'startup' | 'finance' | 'general';
  text: string;
}

export const SAMPLE_RESUMES: SampleResumePreset[] = [
  {
    id: 'junior-gpt-slop',
    name: 'Alex Johnson (Junior Fullstack Developer)',
    role: 'Frontend Engineer',
    experience: '1-2 years',
    companyType: 'startup',
    text: `Alex Johnson
Email: alex.johnson.dev@gmail.com | Phone: (555) 123-4567 | GitHub: github.com/alexj-dev | LinkedIn: linkedin.com/in/alexj-dev

SUMMARY:
Highly motivated, results-oriented Junior Fullstack Developer passionate about coding, leveraging advanced AI tools to create next-generation applications. Experienced in React, Node, Express, MongoDB, and CSS. Strong self-starter with great communication skills seeking an entry-level software engineering role at a fast-paced tech company.

EXPERIENCE:
Junior Web Developer | AgileTech Solutions | June 2025 - Present
* Responsible for developing and maintaining the client's web applications using modern web technologies.
* Helped design and implement user-friendly UI components using React and styled-components for multiple products.
* Successfully collaborated with backend engineers and product teams to integrate REST APIs in a fast-paced environment.
* Participated in daily standups and sprint planning sessions to deliver high-quality outputs under tight deadlines.
* Fixed various frontend and backend bugs, which significantly improved user experience and performance of the portal.

Software Engineering Intern | DevForge Agency | Sept 2024 - Dec 2024
* Worked closely with senior developers to write clean, reusable, and documentable code in a JavaScript environment.
* Created custom landing pages for client onboarding which helped increase sign-ups.
* Assisted in troubleshooting and debugging SQL query bottlenecks in the database server.
* Learned industry methodologies, Git workflows, and built responsive web pages with HTML5 and Tailwind CSS.

PROJECTS:
Taskmaster - React Todo App (Solo Project) | July 2025
* Built a fully-featured, highly interactive Todo application featuring local storage, drag-and-drop mechanics, and categories.
* Utilized React hook states recursively to store tasks and manage active filters beautifully.
* Styled the entire layout with beautiful CSS transitions making task checklist animations look satisfying.

WeatherWise - Real-Time Weather Widget | Feb 2025
* Designed a responsive dashboard connecting to the OpenWeatherMap API to render current metrics for searched zip codes.
* Included custom SVG animations reflecting dry, rainy, cloudy, or snowy weather states.
* Handled API fetch rate bottlenecks elegantly with debounce strategies on search queries.

EDUCATION:
B.S. in Computer Science | State Tech University | Class of 2024
Skills: JavaScript, HTML5, CSS3, TailwindCSS, React, Node.js, Express.js, SQL, MongoDB, Git, Agile, REST APIs.`
  },
  {
    id: 'mid-java-unmeasurable',
    name: 'Marcus Chen (Mid-Level Backend Engineer)',
    role: 'Backend Engineer',
    experience: '4-5 years',
    companyType: 'faang',
    text: `Marcus Chen
San Francisco, CA | marcus.chen@techmail.net | linkedin.com/in/mchen-backend

SUMMARY:
Senior-focused Backend Software Engineer with 4+ years of professional experience building high-traffic services. Proficient in Java, Spring Boot, PostgreSQL, Redis, and cloud architectures. Expert at designing microservices, optimizing database schemas, and increasing application stability.

EXPERIENCE:
Software Engineer II | CoreCloud Enterprises | Jan 2023 - Present
* Rewrote internal authentication microservice with Spring Boot and JWT resulting in faster transaction speeds.
* Spearheaded migration of database tables from monolith structure to microservices structure.
* Wrote multiple unit tests and integration tests with JUnit, raising test coverage across the backend module.
* Designed and built RESTful routes for third-party checkout integrations.
* Managed AWS instances, configured AWS S3 file buckets, and analyzed server logs with Splunk.
* Mentored two incoming software engineering interns to get them acclimating to the architecture.

Backend Developer | RetailSphere | June 2021 - Dec 2022
* Maintained Java Spring framework codebase and implemented multiple new shopping cart features.
* Optimized SQL database indexes and simplified slow nested joins, which reduced server response times.
* Implemented Redis cache tier for product catalog views to prevent redundant database hits.
* Deployed app updates onto Kubernetes environments during weekly release cycles.

PROJECTS:
Personal Ledger - Custom Distributed Cache Layer | 2023
* Designed a custom multi-threaded In-Memory cache storage system in pure Kotlin.
* Implemented LRU cache purging mechanisms and simulated low-level race conditions to verify structural durability.
* Included visual profiling dashboards representing caching efficiency, hit rates, and raw RAM allocation.

EcoShare - Ride Sharing Simulation API | 2022
* Built and simulated real-time driver coordinates on a spatial map utilizing Spring Boot, WebSockets and PostgreSQL PostGIS queries.
* Handled high volumes of concurrent coordinates efficiently using task queues.

EDUCATION:
B.S. in Software Engineering | University of California, Berkeley | 2021
Technical Skills: Java, Spring Boot, Kotlin, SQL, PostgreSQL, Redis, MongoDB, AWS, Kubernetes, Jenkins, Git, REST APIs`
  },
  {
    id: 'staff-generic',
    name: 'Sarah Kim (Staff-Level Product Engineer)',
    role: 'Staff Software Engineer',
    experience: '8+ years',
    companyType: 'startup',
    text: `Sarah Kim
New York, NY | sarah.kim@staffprod.io | (555) 987-6543 | sarahkim.dev

SUMMARY:
Distinguished Staff Software Engineer with 8+ years of expertise shipping web scale products. Practical experience spearheading architectural direction, leading cross-functional teams, and building reliable distributed networks. Passionate about product engineering, UX performance, and mentoring engineers.

EXPERIENCE:
Staff Software Engineer | StreamFlow Media | March 2022 - Present
* Lead a cross-functional squad of 8 engineers focused on content distribution networks and UI speed optimization.
* Architected a brand new client-side streaming client using React. This has lowered streaming lag.
* Collaborated with Principal Architects to design next-generation event-streaming architectures using Kafka.
* Established front-end testing workflows and standard developer lint policies, improving code cleanliness across 14 internal repositories.
* Managed technical debt by iteratively refactoring structural layouts, removing obsolete NPM packages, and improving React re-renders.
* Drive engineering culture by coordinating tech talks, holding design review groups, and mentoring mid-level and senior engineers.

Senior Front-end Engineer | FinTech Wave | Jan 2019 - Feb 2022
* Owned and delivered customer-facing financial onboarding modules using React, Redux, and Node.js.
* Optimized financial calculation scripts resulting in much faster report compilation times.
* Designed modular reusable component toolkit used by 5 discrete product squads.
* Partnered with security auditors to resolve high-threat script injection bugs.

STUDIED SERVICES / WRITING:
* "Understanding React 18 Concurrent Rendering" - Published on Medium (10k+ reads)
* Open Source Contributor to multiple UI design library packages.

EDUCATION:
B.S. in Computer Science & Engineering | MIT | Class of 2017
Expertise: React, TypeScript, Next.js, Node.js, GraphQL, PostgreSQL, Redis, Kafka, AWS, Docker, CI/CD, CSS`
  }
];
