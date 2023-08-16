git clone https://github.com/highlightjs/highlight.js.git
cd highlight.js

npm install
node tools/build.js -n bash diff json lua plaintext vim

cd ..
npm run compress -input='highlight.js/build/highlight.js' -output='./highlight.min.js'