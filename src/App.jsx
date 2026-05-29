import { useState } from "react";

function App() {
  const [logado, setLogado] = useState(
    localStorage.getItem("darkowl_logado") === "true"
  );
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [cadTexto, setCadTexto] = useState("");
  const [resultado, setResultado] = useState(null);
  const [textoFerramenta, setTextoFerramenta] = useState("");
  const [resultadoFerramenta, setResultadoFerramenta] = useState("");

  function entrar() {
    if (usuario === "admin" && senha === "darkowl2026") {
      localStorage.setItem("darkowl_logado", "true");
      setLogado(true);
    } else {
      alert("Usuário ou senha incorretos.");
    }
  }

  function sair() {
    localStorage.removeItem("darkowl_logado");
    setLogado(false);
    setUsuario("");
    setSenha("");
  }

  function limparMarcasDagua(texto) {
    return texto.replace(/^\d{3}\.\d{3}\.\d{3}-\d{2}\s*$/gm, "").trim();
  }

  function formatarDataOperacional(dataTexto) {
    if (!dataTexto) return "[data não informada]";

    const meses = {
      "01": "Jan",
      "02": "Fev",
      "03": "Mar",
      "04": "Abr",
      "05": "Mai",
      "06": "Jun",
      "07": "Jul",
      "08": "Ago",
      "09": "Set",
      "10": "Out",
      "11": "Nov",
      "12": "Dez",
    };

    const match = dataTexto.match(
      /(\d{2})\/(\d{2})\/(\d{4}) às (\d{2}):(\d{2})/
    );

    if (!match) return dataTexto;

    const [, dia, mes, ano, hora, minuto] = match;

    return `${dia}${hora}${minuto}${meses[mes]}${ano}`;
  }

  function extrairCampo(nomeCampo, texto) {
    const regex = new RegExp(`${nomeCampo}:\\s*(.*)`, "i");
    const encontrado = texto.match(regex);
    return encontrado ? encontrado[1].trim() : "";
  }

  function extrairNarrativa(texto) {
    const regex = /Narrativa\s*\n(?:Por:.*\n)?([\s\S]*)/i;
    const encontrado = texto.match(regex);
    return encontrado ? encontrado[1].trim() : "";
  }

  function contarOcorrencias() {
    const linhasIgnoradas = [
      "SUSPEITO",
      "SUSPEITO(A)",
      "INDICIADO",
      "INDICIADO(A)",
      "TESTEMUNHA",
      "AUTOR",
      "AUTOR(A)",
      "SÓ COMUNICANTE",
      "SO COMUNICANTE",
      "VÍTIMA",
      "VITIMA",
    ];

    const linhas = textoFerramenta
      .split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0)
      .filter((linha) => {
        const linhaMaiuscula = linha.toUpperCase();

        if (linhasIgnoradas.includes(linhaMaiuscula)) return false;
        if (/^\d+\s*\/\s*\d{4}\s*\/\s*\d+/.test(linha)) return false;
        if (/^\d{2}\/\d{2}\/\d{4}/.test(linha)) return false;
        if (/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/.test(linha)) return false;
        if (/PORTO ALEGRE|OSORIO|TAVARES|MOSTARDAS|RS-RS/i.test(linha)) return false;
        if (/RUA|R\.|AV\.|AVENIDA|DINARTE|GARIBALDI|VOLUNTÁRIOS|VOLUNTARIOS/i.test(linha)) return false;

        return true;
      });

    const contador = {};

    linhas.forEach((linha) => {
      const nomeOriginal = linha.replace(/\s+/g, " ").trim();

      let nomePadronizado = nomeOriginal
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

      if (nomePadronizado.includes("ENTORPECENTES - TRAFICO")) {
        nomePadronizado = "Entorpecentes - tráfico";
      } else if (nomePadronizado.includes("ENTORPECENTES POSSE")) {
        nomePadronizado = "Entorpecentes posse";
      } else if (nomePadronizado.includes("APREENSAO DE OBJETO")) {
        nomePadronizado = "Apreensão de objeto";
      } else if (nomePadronizado.includes("PERDA DE DOCUMENTO")) {
        nomePadronizado = "Perda de documento";
      } else if (nomePadronizado.includes("POSSEPORTE ILEG ARMA RESTRIT")) {
        nomePadronizado = "Porte ilegal de arma de fogo de uso restrito";
      } else if (
        nomePadronizado.includes("LESAO CORPORAL CULPOSA DIRECAO VEIC AUTOMOTOR")
      ) {
        nomePadronizado = "Lesão corporal culposa direção de veículo automotor";
      } else {
        nomePadronizado = nomeOriginal.toLowerCase();
        nomePadronizado =
          nomePadronizado.charAt(0).toUpperCase() + nomePadronizado.slice(1);
      }

      contador[nomePadronizado] = (contador[nomePadronizado] || 0) + 1;
    });

    const resultadoFinal = Object.entries(contador)
      .sort((a, b) => b[1] - a[1])
      .map(([nome, quantidade]) =>
        quantidade > 1 ? `${nome} (${quantidade}x)` : nome
      )
      .join(", ");

    setResultadoFerramenta(resultadoFinal + ".");
  }

  function gerarDados() {
    const textoLimpo = limparMarcasDagua(cadTexto);

    const protocolo =
      textoLimpo.match(/Ocorrência N\.º\s*(.*)/i)?.[1]?.trim() ||
      textoLimpo.match(/Ocorrência Nº\s*(.*)/i)?.[1]?.trim() ||
      extrairCampo("Protocolo", textoLimpo) ||
      "";

    const natureza =
      textoLimpo.match(
        /Dados da Ocorrência\s*[\s\S]*?Icone\s*\n\s*([^\n]+)\s*\nData\/hora acionamento:/i
      )?.[1]?.trim() ||
      textoLimpo.match(
        /Dados da Ocorrência\s*\n\s*([^\n]+)\s*\nData\/hora acionamento:/i
      )?.[1]?.trim() ||
      extrairCampo("Natureza", textoLimpo) ||
      "";

    const batalhaoMatch = textoLimpo.match(
      /(1º|9º|11º|19º|20º|21º)\s*Batalhão de Pol[ií]cia Militar/i
    );

    const batalhao = batalhaoMatch ? `${batalhaoMatch[1]} BPM` : "[OPM]";

    const batalhaoPreRelease = batalhao
      .replace(" BPM", "")
      .replace("º", "");

    const dataHoraOriginal =
      textoLimpo.match(/Data\/hora acionamento:\s*(.*)/i)?.[1]?.trim() || "";

    const dataHora = formatarDataOperacional(dataHoraOriginal);

    const logradouro = extrairCampo("Logradouro", textoLimpo);
    const numero = extrairCampo("Número", textoLimpo);
    const bairro = extrairCampo("Bairro", textoLimpo);
    const municipioUf = extrairCampo("Municipio/UF", textoLimpo);
    const cep = extrairCampo("CEP", textoLimpo);

    const endereco =
      extrairCampo("Endereço", textoLimpo) ||
      `${logradouro}${numero ? ", " + numero : ""}${
        bairro ? " — Bairro " + bairro : ""
      }${municipioUf ? " — " + municipioUf : ""}${
        cep ? " — CEP " + cep : ""
      }`;

    const solicitante = extrairCampo("Nome", textoLimpo);

    const telefone =
      textoLimpo.match(/\(\d{2}\)\s*\d{4,5}-\d{4}/)?.[0] || "";

    const narrativa =
      extrairCampo("Narrativa", textoLimpo) || extrairNarrativa(textoLimpo);

    const materialidade = narrativa.match(
      /(?:arma|rev[oó]lver|pistola|faca|muni[cç][aã]o|droga|entorpecente|crack|coca[ií]na|maconha|ve[ií]culo|objeto|celular|dinheiro|pneu|produto|material)/i
    )
      ? "[verificar materialidade citada no histórico do CAD]"
      : "";

    const veiculosEnvolvidos = textoLimpo.match(/Veículos\s+Envolvidos/i)
      ? "[verificar veículos envolvidos no CAD]"
      : "";

    const modeloDadosPreliminares = `*${batalhao} - DADOS PRELIMINARES - ${(
      natureza || "OCORRÊNCIA"
    ).toUpperCase()}*

Em ${dataHora}, foi gerada a ocorrência nº ${
      protocolo || "[não informado]"
    }, referente a ${(natureza || "[natureza não informada]").toLowerCase()}, no endereço ${
      endereco || "[endereço não informado]"
    }. Conforme histórico da ocorrência, ${
      (narrativa || "[narrativa não informada]").toLowerCase()
    }. Demais circunstâncias serão apuradas pelos órgãos competentes.`;

    const modeloOcorrenciaBpm = `*⚠️ OCORRÊNCIA ${batalhao} ⚠️*

*CAD:* ${protocolo || "[não informado]"};
*NATUREZA DA OCORRÊNCIA:* ${natureza || "[não informada]"};
*DATA E HORA:* ${dataHora};
*LOCAL:* ${endereco || "[endereço não informado]"};
*SOLICITANTE/CONTATO:* ${solicitante || "[não informado]"} — ${
      telefone || "[telefone não informado]"
    };

*NARRATIVA:* ${(narrativa || "[narrativa não informada]").toUpperCase()}`;

    const modeloPreRelease = `*${(
      natureza || "NATUREZA DA OCORRÊNCIA"
    ).toUpperCase()} - ${
      municipioUf ? municipioUf.split("/")[0].trim().toUpperCase() : "CIDADE"
    } - CPC/${batalhaoPreRelease}BPM*

*Data/Hora:* ${dataHora}.
*Local:* ${endereco || "[local não informado]"}.

*Indivíduo 1:* 
*Alcunha:* 
*Antecedentes criminais:* 

*Indivíduo 2:* 
*Alcunha:* 
*Antecedentes criminais:* 

*Indivíduo 3:* 
*Alcunha:* 
*Antecedentes criminais:* 

*Materialidade:* ${materialidade}

*Veículos envolvidos:* ${veiculosEnvolvidos}

*Resumo do fato:* `;

    setResultado({
      dadosPreliminares: modeloDadosPreliminares,
      ocorrenciaBpm: modeloOcorrenciaBpm,
      preRelease: modeloPreRelease,
    });
  }

  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      alert("Texto copiado!");
    } catch (error) {
      alert("Não foi possível copiar automaticamente.");
    }
  }

  function limparTudo() {
    setCadTexto("");
    setResultado(null);
    setTextoFerramenta("");
    setResultadoFerramenta("");
  }

  if (!logado) {
    return (
      <div style={loginContainer}>
        <div style={loginCard}>
          <img src="/logo.png" alt="Dark Owl" style={loginLogo} />

          <h1 style={loginTitulo}>DarkOwl</h1>

          <p style={loginSubtitulo}>
            Acesso restrito à plataforma operacional
          </p>

          <input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={loginInput}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={loginInput}
          />

          <button onClick={entrar} style={loginBotao}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={topbar}>
        <div style={topbarContent}>
          <div style={logoArea}>
            <img src="/logo.png" alt="Dark Owl" style={logo} />

            <div>
              <h1 style={titulo}>DarkOwl</h1>

              <p style={subtitulo}>
                Plataforma Inteligente de Relatórios Operacionais
              </p>
            </div>
          </div>

          <button onClick={sair} style={botaoSair}>
            Sair
          </button>
        </div>
      </div>

      <div style={layout}>
        <div style={cardEntrada}>
          <h2 style={secaoTitulo}>📋 Colar Texto do CAD</h2>

          <textarea
            placeholder="Cole aqui o texto completo da ocorrência..."
            rows="20"
            value={cadTexto}
            onChange={(e) => setCadTexto(e.target.value)}
            style={textareaStyle}
          />

          <div style={grupoBotoes}>
            <button onClick={gerarDados} style={botaoGerar}>
              Gerar Dados
            </button>

            <button onClick={limparTudo} style={botaoLimpar}>
              Limpar Tudo
            </button>
          </div>

          <div style={cardFerramentas}>
            <h2 style={secaoTitulo}>⚖️ Calculadora de Antecedentes</h2>

            <textarea
              placeholder="Cole os antecedentes criminais, um por linha..."
              rows="10"
              value={textoFerramenta}
              onChange={(e) => setTextoFerramenta(e.target.value)}
              style={textareaStyle}
            />

            <div style={grupoBotoes}>
              <button onClick={contarOcorrencias} style={botaoGerar}>
                Calcular Antecedentes
              </button>

              <button
                onClick={() => {
                  setTextoFerramenta("");
                  setResultadoFerramenta("");
                }}
                style={botaoLimpar}
              >
                Limpar
              </button>
            </div>

            {resultadoFerramenta && (
              <div style={resultadoFerramentaCard}>
                <div style={resultadoHeader}>
                  <h3 style={resultadoTituloMenor}>Resultado</h3>

                  <button
                    onClick={() => copiarTexto(resultadoFerramenta)}
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>{resultadoFerramenta}</p>
              </div>
            )}
          </div>
        </div>

        <div style={colunaResultados}>
          {resultado && (
            <>
              <div style={resultadoCard}>
                <div style={resultadoHeader}>
                  <h2 style={secaoTitulo}>Dados Preliminares</h2>

                  <button
                    onClick={() => copiarTexto(resultado.dadosPreliminares)}
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>{resultado.dadosPreliminares}</p>
              </div>

              <div style={resultadoCard}>
                <div style={resultadoHeader}>
                  <h2 style={secaoTitulo}>Ocorrência BPM</h2>

                  <button
                    onClick={() => copiarTexto(resultado.ocorrenciaBpm)}
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>{resultado.ocorrenciaBpm}</p>
              </div>

              <div style={resultadoCard}>
                <div style={resultadoHeader}>
                  <h2 style={secaoTitulo}>Pré-release</h2>

                  <button
                    onClick={() => copiarTexto(resultado.preRelease)}
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>{resultado.preRelease}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
  padding: "30px",
  color: "white",
  fontFamily: "Arial",
};

const topbar = {
  marginBottom: "30px",
  backgroundColor: "#000000",
  padding: "20px 30px",
  borderRadius: "18px",
  border: "1px solid #111827",
  boxShadow: "0 0 25px rgba(0,0,0,0.6)",
};

const topbarContent = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const logoArea = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
};

const logo = {
  width: "90px",
  height: "90px",
  objectFit: "contain",
};

const titulo = {
  fontSize: "52px",
  fontWeight: "900",
  margin: 0,
  color: "#ffffff",
};

const subtitulo = {
  color: "#94a3b8",
  marginTop: "8px",
  fontSize: "18px",
};

const layout = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "25px",
};

const cardEntrada = {
  backgroundColor: "#0f172a",
  padding: "30px",
  borderRadius: "20px",
  border: "1px solid #1e293b",
  boxShadow: "0 0 25px rgba(37,99,235,0.15)",
};

const colunaResultados = {
  display: "flex",
  flexDirection: "column",
  gap: "25px",
};

const resultadoCard = {
  backgroundColor: "#0f172a",
  padding: "30px",
  borderRadius: "20px",
  border: "1px solid #1e293b",
  boxShadow: "0 0 25px rgba(37,99,235,0.15)",
};

const cardFerramentas = {
  marginTop: "30px",
  backgroundColor: "#020617",
  padding: "25px",
  borderRadius: "18px",
  border: "1px solid #334155",
  boxShadow: "0 0 25px rgba(14,165,233,0.15)",
};

const resultadoFerramentaCard = {
  marginTop: "20px",
  backgroundColor: "#0f172a",
  padding: "20px",
  borderRadius: "14px",
  border: "1px solid #334155",
};

const secaoTitulo = {
  marginBottom: "20px",
  fontSize: "24px",
};

const resultadoTituloMenor = {
  marginBottom: "15px",
  color: "#e2e8f0",
  fontSize: "20px",
};

const textareaStyle = {
  width: "100%",
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "14px",
  padding: "18px",
  color: "white",
  fontSize: "15px",
  resize: "none",
  boxSizing: "border-box",
};

const grupoBotoes = {
  display: "flex",
  gap: "15px",
  marginTop: "20px",
};

const botaoGerar = {
  backgroundColor: "#2563eb",
  border: "none",
  padding: "14px 22px",
  borderRadius: "12px",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold",
};

const botaoLimpar = {
  backgroundColor: "#dc2626",
  border: "none",
  padding: "14px 22px",
  borderRadius: "12px",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold",
};

const resultadoHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const botaoCopiar = {
  backgroundColor: "#16a34a",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const botaoSair = {
  backgroundColor: "#334155",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const resultadoTexto = {
  marginTop: "20px",
  color: "#e2e8f0",
  lineHeight: "1.9",
  whiteSpace: "pre-line",
  fontSize: "15px",
};

const loginContainer = {
  minHeight: "100vh",
  backgroundColor: "#000000",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  fontFamily: "Arial",
};

const loginCard = {
  width: "380px",
  backgroundColor: "#0f172a",
  padding: "35px",
  borderRadius: "22px",
  border: "1px solid #1e293b",
  textAlign: "center",
  boxShadow: "0 0 35px rgba(37,99,235,0.25)",
};

const loginLogo = {
  width: "110px",
  height: "110px",
  objectFit: "contain",
  marginBottom: "15px",
};

const loginTitulo = {
  fontSize: "42px",
  margin: 0,
  color: "#ffffff",
};

const loginSubtitulo = {
  color: "#94a3b8",
  marginBottom: "25px",
};

const loginInput = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "15px",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  backgroundColor: "#1e293b",
  color: "white",
  fontSize: "16px",
};

const loginBotao = {
  width: "100%",
  backgroundColor: "#2563eb",
  border: "none",
  padding: "14px",
  borderRadius: "12px",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default App;