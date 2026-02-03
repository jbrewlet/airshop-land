(function() {
    var script = document.querySelector('script[src*="load-footer"]');
    var basePath = script ? new URL(script.src, location.href).pathname.replace(/\/js\/load-footer\.js.*$/, '/') : '/';

    var tawk = document.createElement('script');
    tawk.async = true;
    tawk.src = 'https://embed.tawk.to/67c20e6c61aa0c190e3e2ea0/1il70gm2o';
    tawk.charset = 'UTF-8';
    tawk.setAttribute('crossorigin', '*');
    document.head.appendChild(tawk);

    fetch(basePath + 'footer.html')
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var placeholder = document.getElementById('footer-placeholder');
            if (placeholder) {
                placeholder.outerHTML = html;
            }
        })
        .catch(function() {});
})();
