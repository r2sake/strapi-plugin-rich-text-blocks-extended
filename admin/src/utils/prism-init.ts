import * as Prism from 'prismjs';


let isInitialized = false;

export const initPrism = async () => {
    if (isInitialized) {
        return;
    }

    // Ensure Prism is globally available
    if (typeof window !== 'undefined') {
        (window as any).Prism = Prism;
    }

    try {
        // Basic dependencies (Core)
        await import('prismjs/components/prism-clike');
        await import('prismjs/components/prism-markup'); // xml, html, svg, mathml
        await import('prismjs/components/prism-css');
        await import('prismjs/components/prism-javascript');

        // Extended dependencies (Sequential Order is Critical)
        await import('prismjs/components/prism-typescript'); // depends on javascript
        await import('prismjs/components/prism-jsx'); // depends on javascript, markup
        await import('prismjs/components/prism-tsx'); // depends on typescript, jsx
        
        // C must be loaded before C++
        await import('prismjs/components/prism-c');

        // Other languages (Can be loaded in parallel)
        await Promise.all([
            import('prismjs/components/prism-bash'),
            import('prismjs/components/prism-json'),
            import('prismjs/components/prism-python'),
            import('prismjs/components/prism-sql'),
            import('prismjs/components/prism-yaml'),
            import('prismjs/components/prism-docker'),
            // basic and vbnet removed due to loading issues
            import('prismjs/components/prism-cpp'), // depends on c
            import('prismjs/components/prism-csharp'),
            import('prismjs/components/prism-go'),
            import('prismjs/components/prism-java'),
            import('prismjs/components/prism-markdown'),
            import('prismjs/components/prism-php'),
            import('prismjs/components/prism-ruby'),
            import('prismjs/components/prism-rust'),
        ]);
        
        isInitialized = true;
        console.log('PrismJS languages loaded successfully');
    } catch (e) {
        console.error('Failed to load PrismJS languages:', e);
    }
};
