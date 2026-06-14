/**
 * src/data/projects.ts
 *
 * Single source of truth for all portfolio projects.
 * To add a project: append one ProjectEntry object to the array below.
 * The UI is generated automatically from this data at boot time.
 */

export type ProjectCategory = 'architecture' | 'systems' | 'ai' | 'devops' | 'graphical';

export interface ProjectMediaVideo {
    type: 'video';
    src: string; // path relative to /public
}

export interface ProjectMediaImage {
    type: 'image';
    src: string;
    alt: string;
}

export interface ProjectMediaPlaceholder {
    type: 'placeholder';
    label?: string;
}

export interface ProjectMediaTerminal {
    type: 'terminal';
    lines: string[];
}

export interface ProjectMediaGallery {
    type: 'gallery';
    images: { src: string; alt: string }[];
}

export type ProjectMedia =
    | ProjectMediaVideo
    | ProjectMediaImage
    | ProjectMediaPlaceholder
    | ProjectMediaTerminal
    | ProjectMediaGallery;

export interface ProjectEntry {
    id: string;
    title: string;
    description: string;
    tags: string[];
    category: ProjectCategory;
    year?: 'Tek1' | 'Tek2';
    github: string; // full URL or '' to hide the link
    media: ProjectMedia;
    relatedSims?: string[];
}

export const PROJECTS: ProjectEntry[] = [
    {
        id: 'arcade',
        title: 'Arcade',
        description: 'Modular gaming architecture. Dynamically loads game libraries (Pacman, Nibbler) and graphics backends (SDL2, SFML, ncurses) at runtime via shared objects.',
        tags: ['C++', 'OOP', 'Dynamic Loading'],
        category: 'graphical',
        github: 'https://github.com/Nexlein/Arcade',
        media: { type: 'video', src: '/projects/arcade/arcade.mp4' },
    },
    {
        id: 'raytracer',
        title: 'Raytracer',
        description: '3D rendering engine built from scratch. Computes lighting, shadows, and reflections by tracing light paths mathematically through a scene definition.',
        tags: ['C++', 'Graphics', 'Maths'],
        category: 'graphical',
        github: 'https://github.com/Nexlein/Raytracer',
        media: {
            type: 'gallery',
            images: [
                { src: '/projects/raytracer/demo.png', alt: 'Demo' },
                { src: '/projects/raytracer/fractals.png', alt: 'Fractals' },
                { src: '/projects/raytracer/glassBall.png', alt: 'Glass Ball' },
                { src: '/projects/raytracer/graphCylinder.png', alt: 'Graph Cylinder' },
                { src: '/projects/raytracer/hourglass.png', alt: 'Hourglass' },
                { src: '/projects/raytracer/iceCream.png', alt: 'Ice Cream' },
                { src: '/projects/raytracer/mirror.png', alt: 'Mirror Room' },
                { src: '/projects/raytracer/mobiusStrip.png', alt: 'Mobius Strip' },
                { src: '/projects/raytracer/pointLight.png', alt: 'Point Light' },
                { src: '/projects/raytracer/tangleCube.png', alt: 'Tangle Cube' },
                { src: '/projects/raytracer/random.png', alt: 'Random shapes' }
            ]
        },
    },
    {
        id: 'plazza',
        title: 'Plazza',
        description: 'Multi-process, multi-threaded pizzeria simulation. Explores concurrent architectures, inter-process communication, and mutex coordination under load.',
        tags: ['C++', 'Concurrency', 'IPC'],
        category: 'architecture',
        github: 'https://github.com/Nexlein/Plazza',
        media: { type: 'video', src: '/projects/plazza/plazza.mp4' },
    },
    {
        id: 'cvrie',
        title: 'Cvrie',
        description: 'A comprehensive machine learning laboratory exploring both supervised and unsupervised learning algorithms, leveraging pandas, numpy, and scikit-learn.',
        tags: ['Python', 'Machine Learning', 'Data Science'],
        category: 'ai',
        github: 'https://github.com/Nexlein/Cvrie',
        media: {
            type: 'image',
            src: '/projects/cvrie/cvrie.jpg',
            alt: 'Abstract visualization of Machine Learning clusters and neural networks'
        },
        relatedSims: ['ml', 'ml-unsupervised']
    },
    {
        id: 'starttrek',
        title: 'StartTrek',
        description: 'Reinforcement Learning agent trained using Deep Q-Networks (DQN) to safely land a lunar module. Features experience replay, target networks, and domain randomization.',
        tags: ['Python', 'PyTorch', 'RL', 'DQN'],
        category: 'ai',
        github: 'https://github.com/Nexlein/StartTrek',
        media: { type: 'video', src: '/projects/starttrek/starttrek.mp4' },
        relatedSims: ['rl']
    },
    {
        id: 'zappy',
        title: 'Zappy',
        description: 'Multiplayer network game where teams of autonomous AI compete on a tile-based world. Built in C/C++ with a server, a graphic client, and autonomous clients driven by FSMs and Utility AI.',
        tags: ['C/C++', 'Network', 'FSM', 'Utility AI', 'Game Dev'],
        category: 'architecture',
        github: 'https://github.com/Nexlein/Zappy',
        media: {
            type: 'video',
            src: '/projects/zappy/zappy.mp4'
        },
        relatedSims: ['fsm', 'uai']
    },
    {
        id: 'persona',
        title: 'Persona',
        description: 'Automated, self-hosted AI system delivering personalized news digests based on user topics and timezones. Built with N8N, Supabase, Mistral AI, and NewsAPI. Includes an interactive chatbot and dynamic Python credential mappers.',
        tags: ['N8N', 'Python', 'Mistral AI', 'Supabase', 'Docker'],
        category: 'ai',
        github: 'https://github.com/Nexlein/Persona',
        media: {
            type: 'image',
            src: '/projects/persona/persona.jpg',
            alt: 'Abstract dataflow network representing an automated AI newsletter system'
        }
    },
    {
        id: 'codename',
        title: 'Codename',
        description: 'A robust testing framework designed to evaluate and fortify Large Language Models against prompt injections and jailbreaks. Integrates adversarial prompting and defensive monitoring to ensure safe LLM deployments.',
        tags: ['Security', 'Python', 'LLM', 'Prompt Engineering'],
        category: 'ai',
        github: 'https://github.com/Nexlein/Codename',
        media: {
            type: 'image',
            src: '/projects/codename/codename.jpg',
            alt: 'Diagram illustrating a prompt input passing through an AI Security Firewall'
        }
    },
    {
        id: 'mymarvin',
        title: 'MyMarvin',
        description: 'A complete CI/CD pipeline automation project based on Jenkins. Uses Docker, Groovy DSL, and Job DSL plugins to define and provision scalable build jobs automatically upon repository updates.',
        tags: ['Jenkins', 'Docker', 'CI/CD', 'Groovy', 'YAML'],
        category: 'devops',
        github: 'https://github.com/Nexlein/MyMarvin',
        media: {
            type: 'image',
            src: '/projects/mymarvin/mymarvin.jpg',
            alt: 'Architecture diagram showing Jenkins automation via Docker and JCasC'
        }
    },
    {
        id: 'octopus',
        title: 'Octopus',
        description: 'An infrastructure-as-code automation project. Uses Ansible to provision, configure, and orchestrate complex environments across multiple remote hosts concurrently, ensuring idempotency and rapid scaling.',
        tags: ['Ansible', 'Vagrant', 'IaC', 'PostgreSQL', 'Redis'],
        category: 'devops',
        github: 'https://github.com/Nexlein/Octopus',
        media: {
            type: 'image',
            src: '/projects/octopus/octopus.jpg',
            alt: 'Diagram showing Ansible automation deploying to multiple virtual machines'
        }
    },
    {
        id: 'nanotekspice',
        title: 'NanoTekSpice',
        description: 'A logic gate simulator built in C++. Models digital electronic components (such as logic gates, clocks, and memory units) using pure Object-Oriented Programming principles.',
        tags: ['C++', 'OOP', 'Simulation', 'Algorithms', 'Architecture'],
        category: 'architecture',
        github: 'https://github.com/Nexlein/NanoTekSpice',
        media: {
            type: 'image',
            src: '/projects/nanotekspice/nanotekspice.jpg',
            alt: 'Vibrant 3D glowing representation of a microchip and electronic circuit board'
        }
    },
    {
        id: 'myradar',
        title: 'MyRadar',
        description: 'A 2D graphical air traffic control simulator built in C using CSFML. Simulates planes navigating between control towers with complex collision detection and sector-based grid optimization.',
        tags: ['C', 'CSFML', 'Graphics', 'Simulation', 'Algorithms'],
        category: 'graphical',
        year: 'Tek1',
        github: 'https://github.com/Nexlein/Myradar',
        media: {
            type: 'video',
            src: '/projects/myradar/myradar.mp4'
        }
    },
    {
        id: 'tardis',
        title: 'Tardis',
        description: 'Data analysis and visualization project culminating in a comprehensive dashboard. Focuses on data processing, statistical modeling, and extracting actionable insights from large datasets.',
        tags: ['Data Science', 'Analytics', 'Dashboard', 'Python'],
        category: 'ai',
        year: 'Tek1',
        github: 'https://github.com/Nexlein/Tardis',
        media: {
            type: 'image',
            src: '/projects/tardis/tardis.png',
            alt: 'Screenshot of the Tardis data analytics dashboard'
        }
    },
    {
        id: 'mytop',
        title: 'MyTop',
        description: 'A customized clone of the Unix top utility. Features real-time system monitoring, process listing, memory metrics, and CPU usage, built with C and the ncurses library.',
        tags: ['C', 'ncurses', 'Unix', 'System Programming', 'Terminal'],
        category: 'systems',
        year: 'Tek1',
        github: 'https://github.com/Nexlein/Mytop',
        media: {
            type: 'video',
            src: '/projects/mytop/mytop.mp4'
        }
    },
    {
        id: 'secured',
        title: 'Secured',
        description: 'A robust C library implementing a highly efficient Hash Table data structure. Features custom cryptographic hashing functions and collision resolution strategies to ensure secure and fast data retrieval.',
        tags: ['C', 'Data Structures', 'Algorithms', 'Security', 'Library'],
        category: 'systems',
        year: 'Tek1',
        github: 'https://github.com/Nexlein/Secured',
        media: {
            type: 'image',
            src: '/projects/secured/secured.jpg',
            alt: 'Holographic 3D visualization of a hash table data structure and digital vault'
        }
    }
];
