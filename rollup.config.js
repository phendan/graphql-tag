export default [{
  entry: 'src/index.js',
  dest: 'lib/graphql-tag.js',
  format: 'cjs',
  sourceMap: true,
  moduleName: 'graphql-tag',
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
