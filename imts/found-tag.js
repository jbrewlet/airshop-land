(function () {
  var params = new URLSearchParams(window.location.search)
  var path = window.location.pathname
  var fromTag = params.get('from') === 'tag' || path === '/t' || path === '/t/'
  if (!fromTag) return
  if (path === '/imts/found' || path === '/imts/found/') return

  params.delete('from')
  var qs = params.toString()
  location.replace('/imts/found/' + (qs ? '?' + qs : ''))
})()
