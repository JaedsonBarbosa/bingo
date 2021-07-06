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
} from "./firebase";

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
    const telefone = pegarResposta("Telefone:");
    return await logarUsuario(
      captchaRef.current,
      telefone,
      async () => pegarResposta("Codigo"),
      async () => {
        const estado = pegarResposta("Estado");
        const municipio = pegarResposta("Municipio");
        const nome = pegarResposta("Nome");
        return { telefone, estado, municipio, nome };
      }
    );
  };

  const logarAdmin = async () => {
    try {
      const usuario = await logar();
      const administrador = new Administrador(usuario);
      console.log(administrador);
      alert("Logado como administrador.");
    } catch (error) {
      console.error(error);
      alert("Erro enquanto tentava logar como adminstrador.");
    }
  };

  const abrirJogo = () => {
    Administrador.current
      .abrirJogo(async () => prompt("Titulo"), {
        onEncerramento: () => alert("Jogo encerrado."),
        onFalso: (usuario, n) =>
          alert(
            `O jogador ${usuario.nome} se enganou, faltam ${n.join(
              ","
            )} serem chamados.`
          ),
        onGanhador: (usuario, cartela) =>
          alert(`O jogador ${usuario.nome} ganhou!`),
      })
      .then((jogo) => {
        console.log(jogo);
        alert("Jogo iniciado");
      })
      .catch((erro) => {
        console.error(erro);
        alert("Erro ao tentar iniciar o jogo");
      });
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
              : "Você não ganhou."
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

  function adicionarNumeroAleatorio() {
    Jogo.current
      .adicionarNumeroAleatorio()
      .then((n) => alert("Adicionado número " + n.toString()))
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar adicionar um número");
      });
  }

  function cancelarJogo() {
    Jogo.current
      .encerrar()
      .then(() => alert("Jogo encerrado com sucesso."))
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar cancelar jogo.");
      });
  }

  function adicionarAdministrador() {
    const id = pegarResposta("ID do novo administrador.");
    Administrador.current
      .adicionarAdministrador(id)
      .then(() => alert(`Usuário de id ${id} agora é um administrador.`))
      .catch((error) => {
        console.error(error);
        alert("Erro ao tetar adicionar administrador.");
      });
  }

  function removerAdministrador() {
    const id = pegarResposta("ID do administrador a ser removido.");
    Administrador.current
      .removerAdministrador(id)
      .then(() => alert(`Usuário de id ${id} não é mais um administrador.`))
      .catch((error) => {
        console.error(error);
        alert("Erro ao tetar remover administrador.");
      });
  }

  function listarAdminsAtivos() {
    Administrador.current
      .listarAdministradoresAtivos()
      .then((admins) => {
        const nomes = admins.map((v) => v.nome).join(", ");
        alert("Os administradores ativos são: " + nomes);
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar listar administradores ativos.");
      });
  }

  function listarAdminsInativos() {
    Administrador.current
      .listarAdministradoresInativos()
      .then((admins) => {
        const nomes = admins.map((v) => v.nome).join(", ");
        alert("Os administradores inativos são: " + nomes);
      })
      .catch((error) => {
        console.error(error);
        alert("Erro ao tentar listar administradores inativos.");
      });
  }

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
      <Text>Administração</Text>
      <Button onPress={logarAdmin} title="Logar administrador" />
      <Button onPress={abrirJogo} title="Abrir jogo" />
      <Button onPress={adicionarNumeroAleatorio} title="Adicionar numero" />
      <Button onPress={cancelarJogo} title="Cancelar jogo" />
      <Button onPress={adicionarAdministrador} title="Adicionar admin" />
      <Button onPress={removerAdministrador} title="Remover administrador" />
      <Button onPress={listarAdminsAtivos} title="Listar admins ativos" />
      <Button onPress={listarAdminsInativos} title="Listar admins inativos" />
      <Text>Usuário comum</Text>
      <Button onPress={logarComum} title="Logar comum" />
      <Button onPress={pegarCartela} title="Pegar cartela" />
      <Button onPress={notificarVitoria} title="Bingo" />
      <Button onPress={() => alert(Usuario.current?.ID)} title="Mostrar ID" />
      <Text>Operações comuns</Text>
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
