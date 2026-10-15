// dist/esm holds ES modules but the package is CommonJS by default, so Node
// would parse them by guesswork (and warn). This marker makes them ESM.
const fs = require('fs');
fs.writeFileSync('dist/esm/package.json', '{"type":"module"}\n');
