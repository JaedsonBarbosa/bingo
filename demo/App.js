import * as React from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import Constants from "expo-constants";

// or any pure javascript modules available in npm
import {
  Administrador,
  Cartela,
  Jogo,
  logarUsuario,
  Usuario,
  habilitarEmulador,
  consultar10UltimosJogos,
  consultarUltimoJogo,
  encerrarSessao,
} from "./firebase";

export default function App() {
  // Chamar habilitarEmulador para usar os emuladores no lugar do servidor
  // habilitarEmulador();

  const captchaRef = React.useRef(null);

  const logar = async () => {
    return await logarUsuario(
      captchaRef.current,
      "83988856440",
      async () => prompt("Codigo"),
      async () => {
        return {
          telefone: "83988856440",
          estado: "PB",
          municipio: "Cuitegi",
          nome: "Jaedson Barbosa Serafim",
        };
      }
    );
  };

  const logarAdmin = async () => {
    const usuario = await logar();
    const administrador = await Administrador.create(usuario);
    console.log(administrador);
  };

  const abrirJogo = async () => {
    const jogo = await Administrador.current.abrirJogo(
      async () => prompt("Titulo"),
      {
        onEncerramento: () => alert("Jogo encerrado."),
        onFalso: (usuario, n) =>
          alert(
            `O jogador ${usuario.nome} se enganou, faltam ${n.join(
              ","
            )} serem chamados.`
          ),
        onGanhador: (usuario, cartela) =>
          alert(`O jogador ${usuario.nome} ganhou!`),
      }
    );
    console.log(jogo);
  };

  const logarComum = async () => {
    const { usuario } = await logar();
    const comum = new Usuario(usuario);
    console.log(comum);
  };

  const pegarCartela = async () => {
    const numerosAvisados = [];
    const cartela = await Usuario.current.getCartela(
      (jogo) => {
        if (!jogo) return;
        const novos = jogo.numeros
          .filter((v) => !numerosAvisados.includes(v))
          .forEach((v) => alert(`Número ${v} chamado.`));
        numerosAvisados.push(...jogo.numeros);
      },
      (cartela) =>
        alert(
          !cartela
            ? "Fim do jogo"
            : cartela.ganhou
            ? "Avisado ao organizador."
            : "Você não ganhou."
        )
    );
    console.log(cartela.cartela.numeros);
  };

  return (
    <View style={styles.container}>
      <div id="recaptcha-container" ref={captchaRef}></div>
      <Text>Administração</Text>
      <Button
        onPress={logarAdmin}
        title="Logar administrador"
        color="#841584"
      />
      <Button onPress={abrirJogo} title="Abrir jogo" color="#841584" />
      <Button
        onPress={() => Jogo.current.adicionarNumeroAleatorio()}
        title="Adicionar numero"
      />
      <Button
        onPress={async () => {
          const id = prompt("ID do novo administrador.");
          if (id) await Administrador.current.adicionarAdministrador(id);
        }}
        title="Adicionar administrador"
      />
      <Button
        onPress={async () => {
          const id = prompt("ID do administrador a ser removido.");
          if (id) await Administrador.current.removerAdministrador(id);
        }}
        title="Remover administrador"
      />
      <Button
        onPress={async () => {
          const admins =
            await Administrador.current.listarAdministradoresAtivos();
          console.log(admins);
        }}
        title="Listar administradores ativos"
      />
      <Button
        onPress={async () => {
          const admins =
            await Administrador.current.listarAdministradoresInativos();
          console.log(admins);
        }}
        title="Listar administradores inativos"
      />
      <Text>Usuário comum</Text>
      <Button onPress={logarComum} title="Logar comum" />
      <Button onPress={pegarCartela} title="Pegar cartela" />
      <Button onPress={() => Cartela.current.bingo()} title="Bingo" />
      <Button onPress={() => alert(Usuario.current.ID)} title="Mostrar ID" />
      <Text>Operações comuns</Text>
      <Button
        onPress={() => consultarUltimoJogo().then((v) => console.log(v))}
        title="Consultar último jogo"
      />
      <Button
        onPress={() => consultar10UltimosJogos().then((v) => console.log(v))}
        title="Consultar últimos jogos"
      />
      <Button
        onPress={() => encerrarSessao().then(() => alert("Sessão encerrada"))}
        title="Encerrar sessão"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
});
