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
* Para atualizar as funções do Firebase Functions usar o comando `firebase deploy --only functions`.
* Para elevar o nível de permissão de um usuário para master deve-se inserir o id no local apropriado no arquivo functions/addMaster.js e, em seguida, executá-lo usando o Node.js. Cabe ressaltar que é necessário ter uma chave privada de sua conta de serviço no seu computador e referenciá-la no local apropriada no arquivo functions/addMaster.js, lembrando que ela nunca deve ser compartilhada com ninguém;

## Avisos finais
Atualizar a versão hospedada do Firebase ou adicionar novos usuários como master só é possível de ser feito por um dos proprietários do projeto, por isso, caso se queira fazer isso recomendo a hospedagem numa conta própria.
