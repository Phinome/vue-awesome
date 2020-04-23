export const icons = {};

export function register(data) {
  for (let name in data) {
    let icon = data[name];
    let { paths = [], d, polygons = [], points } = icon;

    if (d) {
      paths.push({ d });
    }

    if (points) {
      polygons.push({ points });
    }

    icons[name] = assign({}, icon, {
      paths,
      polygons
    });
  }
}
function assign(obj, ...sources) {
  sources.forEach(source => {
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        obj[key] = source[key];
      }
    }
  });

  return obj;
}
