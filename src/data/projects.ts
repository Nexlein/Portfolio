/**
 * src/data/projects.ts
 *
 * Single source of truth for all portfolio projects.
 * To add a project: append one ProjectEntry object to the array below.
 * The UI is generated automatically from this data at boot time.
 */

type ProjectCategory = 'architecture' | 'systems' | 'ai' | 'devops' | 'graphical';

interface ProjectMediaVideo {
    type: 'video';
    src: string; // path relative to /public
}

interface ProjectMediaImage {
    type: 'image';
    src: string;
    alt: string;
}

interface ProjectMediaGallery {
    type: 'gallery';
    images: { src: string; alt: string }[];
}

export type ProjectMedia = ProjectMediaVideo | ProjectMediaImage | ProjectMediaGallery;

export interface ProjectEntry {
    id: string;
    title: string;
    tags: string[];
    category: ProjectCategory;
    year?: 'Tek1' | 'Tek2' | 'Personal';
    github: string; // full URL or '' to hide the link
    media: ProjectMedia;
}

export const PROJECTS: ProjectEntry[] = [
    {
        id: 'arcade',
        title: 'Arcade',
        tags: ['C++', 'OOP', 'Dynamic Loading'],
        category: 'graphical',
        github: 'https://github.com/Nexlein/Arcade',
        media: { type: 'video', src: '/projects/arcade/arcade.mp4' }
    },
    {
        id: 'raytracer',
        title: 'Raytracer',
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
        }
    },
    {
        id: 'plazza',
        title: 'Plazza',
        tags: ['C++', 'Concurrency', 'IPC'],
        category: 'architecture',
        github: 'https://github.com/Nexlein/Plazza',
        media: { type: 'video', src: '/projects/plazza/plazza-optimized.mp4' }
    },
    {
        id: 'cvrie',
        title: 'Cvrie',
        tags: ['Python', 'Machine Learning', 'Data Science'],
        category: 'ai',
        github: 'https://github.com/Nexlein/Cvrie',
        media: {
            type: 'image',
            src: '/projects/cvrie/cvrie.jpg',
            alt: 'Abstract visualization of Machine Learning clusters and neural networks'
        }
    },
    {
        id: 'starttrek',
        title: 'StartTrek',
        tags: ['Python', 'PyTorch', 'RL', 'DQN'],
        category: 'ai',
        github: 'https://github.com/Nexlein/StartTrek',
        media: { type: 'video', src: '/projects/starttrek/starttrek.mp4' }
    },
    {
        id: 'zappy',
        title: 'Zappy',
        tags: ['C/C++', 'Network', 'FSM', 'Utility AI', 'Game Dev'],
        category: 'architecture',
        github: 'https://github.com/Nexlein/Zappy',
        media: {
            type: 'video',
            src: '/projects/zappy/zappy.mp4'
        }
    },
    {
        id: 'persona',
        title: 'Persona',
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
        tags: ['C', 'Data Structures', 'Algorithms', 'Security', 'Library'],
        category: 'systems',
        year: 'Tek1',
        github: 'https://github.com/Nexlein/Secured',
        media: {
            type: 'image',
            src: '/projects/secured/secured.jpg',
            alt: 'Holographic 3D visualization of a hash table data structure and digital vault'
        }
    },
    {
        id: 'blackjack-ai',
        title: 'Blackjack AI',
        tags: ['Python', 'Reinforcement Learning', 'Stable-Baselines3', 'Textual', 'Gymnasium'],
        category: 'ai',
        year: 'Personal',
        github: 'https://github.com/Nexlein/blackjack-ai',
        media: {
            type: 'video',
            src: '/projects/blackjack-ai/blackjack-ai.webm'
        }
    }
];
