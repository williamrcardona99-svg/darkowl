import { useState } from "react";

function App() {
  const [cadTexto, setCadTexto] = useState("");
  const [resultado, setResultado] = useState(null);

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

    const batalhao =
      textoLimpo.match(/(\d+º)\s*Batalhão de Polícia Militar/i)?.[1]?.trim() ||
      "20º";

    const dataHoraOriginal =
  textoLimpo.match(/Data\/hora acionamento:\s*(.*)/i)?.[1]?.trim() ||
  "";

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
      extrairCampo("Narrativa", textoLimpo) ||
      extrairNarrativa(textoLimpo);

    const materialidade =
      narrativa.match(
        /(?:arma|rev[oó]lver|pistola|faca|muni[cç][aã]o|droga|entorpecente|crack|coca[ií]na|maconha|ve[ií]culo|objeto|celular|dinheiro|pneu|produto|material)/i
      )
        ? "[verificar materialidade citada no histórico do CAD]"
        : "";

    const veiculosEnvolvidos =
      textoLimpo.match(/Veículos\s+Envolvidos/i)
        ? "[verificar veículos envolvidos no CAD]"
        : "";

    const modeloDadosPreliminares = `*${batalhao} BPM - DADOS PRELIMINARES - ${(
      natureza || "OCORRÊNCIA"
    ).toUpperCase()}*

Em 251408Mai26, foi gerada a ocorrência nº ${
      protocolo || "[não informado]"
    }, referente a ${
      (natureza || "[natureza não informada]").toLowerCase()
    }, no endereço ${
      endereco || "[endereço não informado]"
    }. Conforme histórico da ocorrência, ${
      (narrativa || "[narrativa não informada]").toLowerCase()
    }. Demais circunstâncias serão apuradas pelos órgãos competentes.`;

    const modeloOcorrenciaBpm = `*⚠️ OCORRÊNCIA ${batalhao} BPM ⚠️*

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
      municipioUf
        ? municipioUf.split("/")[0].trim().toUpperCase()
        : "CIDADE"
    } - CPC/${batalhao.replace("º", "")}BPM*

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
  }

  return (
    <div style={container}>
      <div style={topbar}>
        <div style={logoArea}>
          <img src="/logo.png" alt="Dark Owl" style={logo} />

          <div>
            <h1 style={titulo}>DarkOwl</h1>

            <p style={subtitulo}>
              Plataforma Inteligente de Relatórios Operacionais
            </p>
          </div>
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
        </div>

        <div style={colunaResultados}>
          {resultado && (
            <>
              <div style={resultadoCard}>
                <div style={resultadoHeader}>
                  <h2 style={secaoTitulo}>
                    Dados Preliminares
                  </h2>

                  <button
                    onClick={() =>
                      copiarTexto(resultado.dadosPreliminares)
                    }
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>
                  {resultado.dadosPreliminares}
                </p>
              </div>

              <div style={resultadoCard}>
                <div style={resultadoHeader}>
                  <h2 style={secaoTitulo}>
                    Ocorrência BPM
                  </h2>

                  <button
                    onClick={() =>
                      copiarTexto(resultado.ocorrenciaBpm)
                    }
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>
                  {resultado.ocorrenciaBpm}
                </p>
              </div>

              <div style={resultadoCard}>
                <div style={resultadoHeader}>
                  <h2 style={secaoTitulo}>
                    Pré-release
                  </h2>

                  <button
                    onClick={() =>
                      copiarTexto(resultado.preRelease)
                    }
                    style={botaoCopiar}
                  >
                    Copiar
                  </button>
                </div>

                <p style={resultadoTexto}>
                  {resultado.preRelease}
                </p>
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
  background:
    "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
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

const secaoTitulo = {
  marginBottom: "20px",
  fontSize: "24px",
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

const resultadoTexto = {
  marginTop: "20px",
  color: "#e2e8f0",
  lineHeight: "1.9",
  whiteSpace: "pre-line",
  fontSize: "15px",
};

export default App;