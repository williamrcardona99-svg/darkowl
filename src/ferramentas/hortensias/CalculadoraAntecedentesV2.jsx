
import { useState } from "react";

const QUALIFICACOES_VALIDAS = [
  "AUTOR(A)",
  "SUSPEITO(A)",
  "INDICIADO(A)",
  "ACUSADO(A)",
  "MENOR INFRATOR",
];

const QUALIFICACOES_EXCLUIDAS = [
  "VITIMA",
  "VÍTIMA",
  "TESTEMUNHA",
  "SO COMUNICANTE",
  "SÓ COMUNICANTE",
  "COMUNICANTE",
  "MOTORISTA",
];

function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function ehNumeroOcorrencia(linha) {
  return /^\d+\s*\/\s*\d{4}\s*\/\s*\d+$/.test(linha.trim());
}

function formatarNatureza(natureza) {
  return natureza
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s-])([a-záéíóúãõâêôç])/g, (match) =>
      match.toUpperCase()
    );
}



function analisarAntecedentes(texto) {
  const qualificacoesValidas = [
    "AUTOR(A)",
    "SUSPEITO(A)",
    "INDICIADO(A)",
    "ACUSADO(A)",
    "MENOR INFRATOR",
  ];

  const qualificacoesExcluidas = [
    "VITIMA",
    "TESTEMUNHA",
    "SO COMUNICANTE",
    "COMUNICANTE",
    "MOTORISTA",
  ];

  function normalizar(valor) {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  const linhas = texto
    .replace(/\r/g, "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

  const registrosBrutos = [];
  let atual = null;

  for (const linha of linhas) {
    const numero = linha.match(/^(\d+\s*\/\s*\d{4}\s*\/\s*\d+)$/);

    if (numero) {
      if (atual) registrosBrutos.push(atual);

      atual = {
        numero: numero[1].replace(/\s+/g, ""),
        qualificacao: "",
        natureza: "",
      };

      continue;
    }

    if (!atual) continue;

    const qualificacao = [
      ...qualificacoesValidas,
      ...qualificacoesExcluidas,
    ].find((item) => normalizar(item) === normalizar(linha));

    if (qualificacao) {
      atual.qualificacao = normalizar(qualificacao);
      continue;
    }

    // Procura a linha que contém a data e hora do fato.
    const dataHora = linha.match(
      /\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\b/
    );

    if (dataHora) {
      // A natureza normalmente está na próxima linha.
      continue;
    }

    // Identifica a natureza pela linha imediatamente posterior
    // à linha que contém a data e hora do fato.
    const indice = linhas.indexOf(linha);
    const linhaAnterior = indice > 0 ? linhas[indice - 1] : "";

    if (
      /\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\b/.test(linhaAnterior)
    ) {
      atual.natureza = linha.trim();
    }
  }

  if (atual) registrosBrutos.push(atual);

  const numerosVistos = new Set();
  const contabilizados = [];
  const duplicidades = [];
  const naoContabilizados = [];

  for (const registro of registrosBrutos) {
    if (numerosVistos.has(registro.numero)) {
      duplicidades.push(registro.numero);
      continue;
    }

    numerosVistos.add(registro.numero);

    if (!qualificacoesValidas.some(
      (item) => normalizar(item) === registro.qualificacao
    )) {
      naoContabilizados.push(registro);
      continue;
    }

    if (!registro.natureza) {
      naoContabilizados.push(registro);
      continue;
    }

    contabilizados.push(registro);
  }

  const agrupados = {};

  for (const registro of contabilizados) {
    const chave = normalizar(registro.natureza);

    if (!agrupados[chave]) {
      agrupados[chave] = {
        nome: formatarNatureza(registro.natureza),
        quantidade: 0,
      };
    }

    agrupados[chave].quantidade++;
  }

  const resultado = Object.values(agrupados)
    .sort((a, b) => b.quantidade - a.quantidade)
    .map((item) => `${item.nome} (${item.quantidade}x)`)
    .join(", ");

  return {
    resultado,
    contabilizados: contabilizados.length,
    duplicidades,
    naoContabilizados,
  };
}

export default function CalculadoraAntecedentesV2() {
  const [texto, setTexto] = useState("");
  const [analise, setAnalise] = useState(null);

  const cores = {
    card: "#111b2e",
    borda: "#293750",
    texto: "#f1f5f9",
    secundario: "#94a3b8",
    campo: "#202d42",
    azul: "#2563eb",
    vermelho: "#dc2626",
  };

  const campoTexto = {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    borderRadius: 12,
    border: `1px solid ${cores.borda}`,
    background: cores.campo,
    color: cores.texto,
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
  };

  const botao = {
    border: "none",
    borderRadius: 9,
    padding: "12px 18px",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  };

  async function copiar() {
    if (!analise?.resultado) return;

    try {
      await navigator.clipboard.writeText(analise.resultado);
      alert("Antecedentes copiados!");
    } catch {
      alert("Não foi possível copiar automaticamente.");
    }
  }

  function calcular() {
    if (!texto.trim()) {
      alert("Cole os antecedentes antes de calcular.");
      return;
    }

    setAnalise(analisarAntecedentes(texto));
  }

  function limpar() {
    setTexto("");
    setAnalise(null);
  }

  return (
    <div style={{ width: "100%", display: "grid", gap: 20 }}>
      <div
        style={{
          background: cores.card,
          border: `1px solid ${cores.borda}`,
          borderRadius: 16,
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: cores.texto, marginTop: 0 }}>
          ⚖️ Calculadora de Antecedentes V2
        </h2>

        <p style={{ color: cores.secundario, fontSize: 13 }}>
          Cole o conteúdo dos registros para realizar a análise.
        </p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o texto completo dos antecedentes..."
          rows={16}
          style={campoTexto}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button
            onClick={calcular}
            style={{ ...botao, background: cores.azul }}
          >
            Calcular antecedentes
          </button>

          <button
            onClick={limpar}
            style={{ ...botao, background: cores.vermelho }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div
        style={{
          background: cores.card,
          border: `1px solid ${cores.borda}`,
          borderRadius: 16,
          padding: 24,
          minHeight: 140,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ color: cores.texto, marginTop: 0 }}>
            Resultado
          </h2>

          {analise?.resultado && (
            <button
              onClick={copiar}
              style={{ ...botao, background: cores.azul }}
            >
              Copiar
            </button>
          )}
        </div>

        {analise ? (
          <>
            <p style={{ color: cores.texto, lineHeight: 1.8 }}>
              {analise.resultado || "Nenhum antecedente identificado."}
            </p>

            <div style={{ borderTop: `1px solid ${cores.borda}`, paddingTop: 12, marginTop: 16 }}>
              <p style={{ color: cores.secundario, fontSize: 13 }}>
                Registros contabilizados: {analise.contabilizados}
              </p>
              <p style={{ color: cores.secundario, fontSize: 13 }}>
                Duplicidades ignoradas: {analise.duplicidades.length}
              </p>
              <p style={{ color: cores.secundario, fontSize: 13 }}>
                Registros não contabilizados: {analise.naoContabilizados.length}
              </p>
            </div>
          </>
        ) : (
          <p style={{ color: cores.secundario }}>
            O resultado da análise aparecerá aqui.
          </p>
        )}
      </div>
    </div>
  );
}
