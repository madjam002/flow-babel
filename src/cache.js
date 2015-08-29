const _cache = {}

export default {
  get(key, callback) {
    if (!_cache[key]) {
      return _cache[key] = callback()
    } else {
      return _cache[key]
    }
  }
}
