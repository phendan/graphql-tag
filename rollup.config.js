export default [{
  entry: 'src/index.js',
  dest: 'lib/index.js',
  format: 'cjs',
  sourceMap: true,
  onwarn
},
{
  entry: 'src/runtime.js',
  dest: 'lib/runtime.js',
  format: 'cjs',
  sourceMap: true,
  onwarn
}
];

function onwarn(message) {
  const suppressed = [
    'UNRESOLVED_IMPORT',
    'THIS_IS_UNDEFINED'
  ];

  if (!suppressed.find(code => message.code === code)) {
    return console.warn(message.message);
  }
}
