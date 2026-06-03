import { useState } from "react";

function App() {
  const [logado, setLogado] = useState(
    localStorage.getItem("darkowl_logado") === "true"
  );
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [abaAtiva, setAbaAtiva] = useState("cad");

  const [cadTexto, setCadTexto] = useState("");
  const [resultado, setResultado] = useState(null);

  const [textoFerramenta, setTextoFerramenta] = useState("");
  const [resultadoFerramenta, setResultadoFerramenta] = useState("");

  const [releaseTexto, setReleaseTexto] = useState("");
  const [resultadoRelease, setResultadoRelease] = useState(null);

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
    const linhas = textoFerramenta
      .split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);

    const tiposValidos = [
      "SUSPEITO(A)",
      "INDICIADO(A)",
      "AUTOR(A)",
      "ACUSADO(A)",
    ];

    let considerarProximaNatureza = false;
    const contador = {};

    linhas.forEach((linha) => {
      const linhaMaiuscula = linha.toUpperCase();

      if (tiposValidos.includes(linhaMaiuscula)) {
        considerarProximaNatureza = true;
        return;
      }

      if (
        linhaMaiuscula === "TESTEMUNHA" ||
        linhaMaiuscula === "VÍTIMA" ||
        linhaMaiuscula === "VITIMA" ||
        linhaMaiuscula === "SÓ COMUNICANTE" ||
        linhaMaiuscula === "SO COMUNICANTE" ||
        linhaMaiuscula === "COMUNICANTE"
      ) {
        considerarProximaNatureza = false;
        return;
      }

      const pareceNatureza =
        linhaMaiuscula.includes("ENTORPECENTES") ||
        linhaMaiuscula.includes("APREENSAO") ||
        linhaMaiuscula.includes("LESAO") ||
        linhaMaiuscula.includes("ROUBO") ||
        linhaMaiuscula.includes("FURTO") ||
        linhaMaiuscula.includes("RECEPTACAO") ||
        linhaMaiuscula.includes("ARMA") ||
        linhaMaiuscula.includes("HOMICIDIO") ||
        linhaMaiuscula.includes("AMEACA") ||
        linhaMaiuscula.includes("DANO") ||
        linhaMaiuscula.includes("DOCUMENTO");

      if (!pareceNatureza || !considerarProximaNatureza) return;

      let nomePadronizado = linhaMaiuscula
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

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
        nomePadronizado.includes(
          "LESAO CORPORAL CULPOSA DIRECAO VEIC AUTOMOTOR"
        )
      ) {
        nomePadronizado = "Lesão corporal culposa direção de veículo automotor";
      } else {
        nomePadronizado =
          linha.charAt(0).toUpperCase() + linha.slice(1).toLowerCase();
      }

      contador[nomePadronizado] = (contador[nomePadronizado] || 0) + 1;
      considerarProximaNatureza = false;
    });

    const resultadoFinal = Object.entries(contador)
      .sort((a, b) => b[1] - a[1])
      .map(([nome, quantidade]) =>
        quantidade > 1 ? `${nome} (${quantidade}x)` : nome
      )
      .join(", ");

    const totalIndiciamentos = Object.values(contador).reduce(
      (total, quantidade) => total + quantidade,
      0
    );

    setResultadoFerramenta(
      `Total de indiciamentos: ${totalIndiciamentos}.

${resultadoFinal}.`
    );
  }

  function converterDataReleaseParaExcel(dataTexto) {
    const meses = {
      Jan: "01",
      Fev: "02",
      Mar: "03",
      Abr: "04",
      Mai: "05",
      Jun: "06",
      Jul: "07",
      Ago: "08",
      Set: "09",
      Out: "10",
      Nov: "11",
      Dez: "12",
    };

    const match = dataTexto.match(/(\d{2})\d{4}([A-Za-z]{3})(\d{2,4})/);

    if (!match) return "";

    const [, dia, mesTexto, anoTexto] = match;
    const mes = meses[mesTexto] || "";
    const ano = anoTexto.length === 2 ? `20${anoTexto}` : anoTexto;

    return `${dia}/${mes}/${ano}`;
  }

  function identificarCrime(titulo) {
    const t = titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (t.includes("TRAFICO")) return "TRÁFICO DE ENTORPECENTES";
    if (t.includes("ROUBO DE VEICULO")) return "ROUBO DE VEÍCULO";
    if (t.includes("ROUBO A PEDESTRE")) return "ROUBO A PEDESTRE";
    if (t.includes("RECEPTACAO")) return "RECEPTAÇÃO";
    if (t.includes("FURTO QUALIFICADO")) return "FURTO QUALIFICADO";
    if (t.includes("FURTO")) return "FURTO";
    if (t.includes("HOMICIDIO")) return "HOMICÍDIO";
    if (t.includes("PORTE ILEGAL")) return "PORTE ILEGAL DE ARMA DE FOGO";
    if (t.includes("LEI MARIA DA PENHA")) return "LEI MARIA DA PENHA";
    if (t.includes("LESAO CORPORAL")) return "LESÃO CORPORAL";

    return "OUTROS CRIMES";
  }

 function gerarExtratorRelease() {
  const texto = releaseTexto;

  function limparMarkdown(valor) {
    return valor
      ? valor.replace(/\*/g, "").replace(/–/g, "-").trim()
      : "";
  }

  function extrairLinha(rotulo) {
    const regex = new RegExp(`\\*?${rotulo}:\\*?\\s*([^\\n]+)`, "i");
    return limparMarkdown(texto.match(regex)?.[1] || "");
  }

  function extrairBloco(inicio, fimAlternativo = null) {
    const fim = fimAlternativo || "Resumo do fato|Histórico";
    const regex = new RegExp(
      `\\*?${inicio}:?\\*?\\s*([\\s\\S]*?)(?=\\n\\s*\\*?(?:${fim}):?\\*?|$)`,
      "i"
    );

    return texto.match(regex)?.[1]?.trim() || "";
  }

  const primeiraLinha =
    limparMarkdown(texto.split("\n").find((l) => l.trim() !== "") || "");

  const titulo = primeiraLinha.replace(/PRISÃO POR\s*/i, "").trim();

  const dataRelease =
    extrairLinha("Data/Hora") ||
    extrairLinha("Data") ||
    "";

  const dataExcel = converterDataReleaseParaExcel(dataRelease);

  const local = extrairLinha("Local");

  const partesLocal = local.split("-");
  const enderecoCompleto = partesLocal[0]?.trim() || "";
  const bairro = partesLocal[1]?.replace(".", "").trim() || "";

  const numeroMatch = enderecoCompleto.match(/(?:nº|n°|,)\s*(\d+)/i);
  const numero = numeroMatch ? numeroMatch[1] : "";

  const endereco = enderecoCompleto
    .replace(/(?:nº|n°|,)\s*\d+/i, "")
    .trim();

  const btl =
    texto.match(/CPC\/(\d+º?)\s*BPM/i)?.[1]?.replace("º", "") || "";

  const batalhao = btl ? `${btl}º BPM` : "";

  const crime = identificarCrime(titulo);

  const autorLinha =
  extrairLinha("Preso") ||
  extrairLinha("Presa") ||
  extrairLinha("Autor") ||
  extrairLinha("Autora");
  const vitimaLinha = extrairLinha("Vítima") || extrairLinha("Vitima");
  const veiculoLinha = extrairLinha("Veículo") || extrairLinha("Veiculo");

  const antecedentes = extrairLinha("Antecedentes");
  const orcrim = extrairLinha("OrCrim");
  const mpu = extrairLinha("MPU");

  const historico =
    extrairBloco("Histórico") ||
    extrairBloco("Resumo do fato") ||
    "";

  const materialidadeBloco = extrairBloco("Materialidade");

  const materialidadeItens = materialidadeBloco
    .split("\n")
    .map((linha) => linha.replace("-", "").trim())
    .filter((linha) => linha.length > 0);

  const materialidadeTexto =
    materialidadeItens.length > 0
      ? materialidadeItens.join(", ").replace(/, ([^,]*)$/, " e $1")
      : "";

  function extrairPessoa(linha) {
    return {
      nome: linha.split(",")[0]?.trim().toUpperCase() || "",
      rg: linha.match(/RG\s*([\d]+)/i)?.[1] || "",
      idade: linha.match(/(\d+)\s*anos/i)?.[1] || "",
    };
  }

  const autor = extrairPessoa(autorLinha);
  const vitima = extrairPessoa(vitimaLinha);

  const temAutor = autor.nome.length > 0;
const temPreso = extrairLinha("Preso") || extrairLinha("Presa");
  const temVitima = vitima.nome.length > 0;
  const temVeiculo = veiculoLinha.length > 0;
  const temMaterialidade = materialidadeItens.length > 0;

  const moradorRua = /morador de rua|situa[cç][aã]o de rua/i.test(texto)
    ? "SIM"
    : "";

  const linhasExcel = temAutor
    ? [
        [
  dataExcel,

  "",
  "",
  "",

  endereco,
  numero,
  bairro,
  batalhao,
  crime,

  "",

  autor.nome,
  autor.rg,

  "",

  autor.idade,

  "",

  moradorRua,
].join("\t")
      ]
    : [];

  let textoRpi = "";

  if (temVeiculo && !temAutor) {
    textoRpi = `Em ${dataRelease || "[data não informada]"}, no endereço ${
      local || "[local não informado]"
    }, em Porto Alegre/RS, guarnições do ${
      batalhao || "[BTL não informado]"
    } atenderam ocorrência de recuperação de veículo, sendo recuperado o veículo ${
      veiculoLinha || "[veículo não informado]"
    }. Conforme resumo do fato, ${historico || "[histórico não informado]"}`;
  } else if (temVitima) {
    textoRpi = `Em ${dataRelease || "[data não informada]"}, no endereço ${
      local || "[local não informado]"
    }, em Porto Alegre/RS, guarnições do ${
      batalhao || "[BTL não informado]"
    } atenderam ocorrência de ${crime.toLowerCase()}, envolvendo como vítima ${
      vitima.nome || "[vítima não identificada]"
    }${vitima.rg ? `, RG ${vitima.rg}` : ""}${
      vitima.idade ? `, ${vitima.idade} anos` : ""
    }${
      temAutor
        ? `, e como autor ${autor.nome}${autor.rg ? `, RG ${autor.rg}` : ""}${
            autor.idade ? `, ${autor.idade} anos` : ""
          }`
        : ""
    }${
      antecedentes ? `, com antecedentes por ${antecedentes}` : ""
    }${orcrim ? `, com possível vínculo à OrCrim ${orcrim}` : ""}.${
      mpu ? ` MPU: ${mpu}.` : ""
    } Conforme resumo do fato, ${historico || "[histórico não informado]"}`;
  } else if (!temAutor && temMaterialidade) {
    textoRpi = `Em ${dataRelease || "[data não informada]"}, no endereço ${
      local || "[local não informado]"
    }, em Porto Alegre/RS, guarnições do ${
      batalhao || "[BTL não informado]"
    } realizaram apreensão de materialidade relacionada a ${crime.toLowerCase()}. Durante a ação, foram apreendidos ${materialidadeTexto}. Conforme resumo do fato, ${
      historico || "[histórico não informado]"
    }`;
  } else {
    textoRpi = `Em ${dataRelease || "[data não informada]"}, no endereço ${
      local || "[local não informado]"
    }, em Porto Alegre/RS, guarnições do ${
      batalhao || "[BTL não informado]"
    } atenderam ocorrência de ${crime.toLowerCase()} envolvendo ${
      autor.nome || "[indivíduo não identificado]"
    }${autor.rg ? `, RG ${autor.rg}` : ""}${
      autor.idade ? `, ${autor.idade} anos` : ""
    }${
      antecedentes ? `, com antecedentes por ${antecedentes}` : ""
    }${orcrim ? `, com possível vínculo à OrCrim ${orcrim}` : ""}.${
      materialidadeTexto
        ? ` Na ação, foram apreendidos ${materialidadeTexto}.`
        : ""
    } Conforme histórico, ${historico || "[histórico não informado]"}`;
  }

  setResultadoRelease({
    rpi: textoRpi,
    excel: linhasExcel.join("\n"),
  });
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

      <div style={menuAbas}>
        <button
          onClick={() => setAbaAtiva("cad")}
          style={abaAtiva === "cad" ? botaoAbaAtiva : botaoAba}
        >
          📋 CAD
        </button>

        <button
          onClick={() => setAbaAtiva("release")}
          style={abaAtiva === "release" ? botaoAbaAtiva : botaoAba}
        >
          📊 Extrator de Release
        </button>
      </div>
            {abaAtiva === "cad" && (
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
      )}

      {abaAtiva === "release" && (
        <div style={layout}>
          <div style={cardEntrada}>
            <h2 style={secaoTitulo}>📊 Extrator de Release</h2>

            <textarea
              placeholder="Cole aqui o release pronto..."
              rows="22"
              value={releaseTexto}
              onChange={(e) => setReleaseTexto(e.target.value)}
              style={textareaStyle}
            />

            <div style={grupoBotoes}>
              <button onClick={gerarExtratorRelease} style={botaoGerar}>
                Gerar RPI e Linha Excel
              </button>

              <button
                onClick={() => {
                  setReleaseTexto("");
                  setResultadoRelease(null);
                }}
                style={botaoLimpar}
              >
                Limpar
              </button>
            </div>
          </div>

          <div style={colunaResultados}>
            {resultadoRelease && (
              <>
                <div style={resultadoCard}>
                  <div style={resultadoHeader}>
                    <h2 style={secaoTitulo}>
                      Relatório Periódico de Inteligência
                    </h2>

                    <button
                      onClick={() => copiarTexto(resultadoRelease.rpi)}
                      style={botaoCopiar}
                    >
                      Copiar
                    </button>
                  </div>

                  <p style={resultadoTexto}>{resultadoRelease.rpi}</p>
                </div>

                <div style={resultadoCard}>
                  <div style={resultadoHeader}>
                    <h2 style={secaoTitulo}>Linha para Excel</h2>

                    <button
                      onClick={() => copiarTexto(resultadoRelease.excel)}
                      style={botaoCopiar}
                    >
                      Copiar
                    </button>
                  </div>

                  <p style={resultadoTexto}>{resultadoRelease.excel}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

const menuAbas = {
  display: "flex",
  gap: "15px",
  marginBottom: "25px",
};

const botaoAba = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  padding: "12px 20px",
  borderRadius: "12px",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: "bold",
};

const botaoAbaAtiva = {
  backgroundColor: "#2563eb",
  border: "1px solid #60a5fa",
  padding: "12px 20px",
  borderRadius: "12px",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: "bold",
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
  color: "#ffffff",
};

const resultadoTituloMenor = {
  marginBottom: "15px",
  color: "#ffffff",
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