// Service Worker Init - WalipherOS v1.6.4
// Purpose: Manage SW registration and Cache Busting

if ('serviceWorker' in navigator) {
    // 1. Unregister any old Service Workers to ensure fresh start (Zombie SW Killer)
    // Since we don't have a 'sw.js' in the root right now, we should ensure no ghost controls the page.
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            console.log('Unregistering Service Worker:', registration);
            registration.unregister();
        }
    });

    /* 
    // Future SW Registration (When sw.js is ready)
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW Registered'))
            .catch(err => console.log('SW Error:', err));
    });
    */
}
