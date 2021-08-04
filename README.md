# Bingo
## Requerimentos
Esta aplicação funciona usando o Expo e o Firebase, portanto os seguintes componentes precisar estar instalados no computador para o correto desenvolvimento:
Node.js
Git
Expo `npm install -g expo-cli`
Firebase `npm install -g firebase-tools`

Como IDE, recomendo o VSCode, não é obrigatório mas ajuda bastante no desenvolvimento.

## Pré-desenvolvimento
Não esquecer de executar o comando `npm install` dentro da pasta demo antes de tentar iniciar o aplicativo demo.

## Comandos úteis
* Para publicar o projeto no Expo basta rodar dentro da pasta demo `npm run publish`.
* Para atualizar a versão Web hospedada no Firebase Hosting, basta executar o comando `npm run build` dentro da pasta demo e, depois, fora da pasta demo, executar `firebase deploy --only hosting`.
* Para atualizar as regras do Firestore usar o comando `firebase deploy --only firestore`.

{"apiKey":"AIzaSyDhxqDJPSacpKe_gx1n4BppD17L4qUR8lo","authDomain":"voicebingo.firebaseapp.com","projectId":"voicebingo","storageBucket":"voicebingo.appspot.com","messagingSenderId":"574006113930","appId":"1:574006113930:web:f7ef107158ce38e46f1f73"}

Implementar indices no firebase.indexes.json em relação aos filtros. Basta usar a adição automática e, após todos, sobrescrever o arquivo usando o firebase init firestore.