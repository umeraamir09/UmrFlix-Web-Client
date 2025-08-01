
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public/icons');
const outputDir = path.join(__dirname, 'components/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const iconFiles = fs.readdirSync(iconsDir).filter((file) => file.endsWith('.svg'));

const indexFileContent = [];

iconFiles.forEach((file) => {
  const iconName = path.basename(file, '.svg').replace("Name=", "");
  const componentName = iconName.replace(/[^a-zA-Z0-9]/g, '');
  const componentFileName = `${componentName}.tsx`;
  const componentFilePath = path.join(outputDir, componentFileName);

  const svgContent = fs.readFileSync(path.join(iconsDir, file), 'utf-8');

  const componentContent = `
import React from 'react';

const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (
  ${svgContent.replace(/<svg(.*?)>/, '<svg{...props}$1>')}
);

export default ${componentName};
  `;

  fs.writeFileSync(componentFilePath, componentContent.trim());
  indexFileContent.push(`export { default as ${componentName} } from './${componentName}';`);
});

const indexFilePath = path.join(outputDir, 'index.ts');
fs.writeFileSync(indexFilePath, indexFileContent.join('\n'));

console.log('Icons generated successfully!');


