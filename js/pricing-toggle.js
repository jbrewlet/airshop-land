(function setupPricingToggle() {
  var toggleButtons = document.querySelectorAll('.pricing-toggle-btn')
  if (!toggleButtons.length) return

  function setBillingMode(mode) {
    toggleButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-billing') === mode)
    })

    document.querySelectorAll('.billing-original, .billing-promo, .billing-meta').forEach(function (el) {
      var nextValue = el.getAttribute('data-' + mode)
      if (nextValue) {
        el.textContent = nextValue
      }
    })

    document.querySelectorAll('.billing-plan-savings').forEach(function (el) {
      var nextValue = el.getAttribute('data-' + mode) || ''
      el.textContent = nextValue
      el.classList.toggle('is-active', Boolean(nextValue))
    })
  }

  toggleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setBillingMode(btn.getAttribute('data-billing') || 'monthly')
    })
  })
})()
