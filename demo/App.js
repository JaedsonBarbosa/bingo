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
  consultarUltimoJogo as _consultarUltimoJogo,
  encerrarSessao as _encerrarSessao,
} from "./connect";

export default function App() {
  // Chamar habilitarEmulador para usar os emuladores no lugar do servidor
  habilitarEmulador();

  const captchaRef = React.useRef(null);

  function pegarResposta(pergunta) {
    let resposta = "";
    do {
      resposta = prompt(pergunta);
    } while (resposta.length < 2);
    return resposta;
  }

  const logar = async () => {
    let telefone = "";
    return await logarUsuario(
      captchaRef.current,
      async () => {
        if (telefone) return telefone;
        return (telefone = pegarResposta("Telefone:"));
      },
      async () => pegarResposta("Codigo"),
      async () => {
        const estado = pegarResposta("Estado");
        const municipio = pegarResposta("Municipio");
        const nome = pegarResposta("Nome");
        return { estado, municipio, nome };
      }
    );
  };

  const logarComum = async () => {
    try {
      const { usuario } = await logar();
      const comum = new Usuario(usuario);
      console.log(comum);
      alert("Logado como usuário comum");
    } catch (error) {
      console.error(error);
      alert("Erro ao tentar logar como usuário comum.");
    }
  };

  const pegarCartela = async () => {
    try {
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
              : "Você ainda não ganhou."
          )
      );
      console.log(cartela.cartela.numeros);
      alert(
        "Cartela gerada com os números " + cartela.cartela.numeros.join(", ")
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao tentar gerar cartela.");
    }
  };

  function notificarVitoria() {
    Cartela.current
      .bingo()
      .then(() => alert("Vitória notificada"))
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar notificar vitória");
      });
  }

  function consultarUltimoJogo() {
    _consultarUltimoJogo()
      .then((v) => {
        console.log(v);
        alert(JSON.stringify(v));
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar consultar o último jogo");
      });
  }

  function consultarUltimosJogos() {
    consultar10UltimosJogos()
      .then((v) => {
        console.log(v);
        alert(JSON.stringify(v));
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar consultar os últimos jogos.");
      });
  }

  function encerrarSessao() {
    _encerrarSessao()
      .then(() => alert("Sessão encerrada"))
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar encerrar sessão.");
      });
  }

  return (
    <View style={styles.container}>
      <div id="recaptcha-container" ref={captchaRef}></div>
      <Button onPress={logarComum} title="Logar comum" />
      <Button onPress={pegarCartela} title="Pegar cartela" />
      <Button onPress={notificarVitoria} title="Bingo" />
      <Button onPress={() => alert(Usuario.current?.ID)} title="Mostrar ID" />
      <Button onPress={consultarUltimoJogo} title="Consultar último jogo" />
      <Button onPress={consultarUltimosJogos} title="Consultar últimos jogos" />
      <Button onPress={encerrarSessao} title="Encerrar sessão" />
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
