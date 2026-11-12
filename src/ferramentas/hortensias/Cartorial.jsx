
import { useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";

export default function Cartorial() {
  const [textoConsulta, setTextoConsulta] = useState("");
  const [fotografia, setFotografia] = useState(null);
  const [ocorrencias, setOcorrencias] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [interpretado, setInterpretado] = useState(false);
  const [gerando, setGerando] = useState(false);

  const [dados, setDados] = useState({
    nome: "",
    rg: "",
    alcunha: "",
    cpf: "",
    nascimento: "",
    filiacao: "",
    endereco: "",
  });

  const estiloCampo = {
    width: "100%",
    minHeight: "42px",
    boxSizing: "border-box",
    padding: "9px",
    fontSize: "13px",
    color: "#E5E7EB",
    background: "#1e293b",
    border: "1px solid #52627a",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
  };

  const estiloTitulo = {
    color: "#E2E8F0",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0 0 8px 0",
  };

  const estiloPainel = {
    background: "#162235",
    border: "1px solid #263449",
    borderRadius: "10px",
    padding: "12px",
    minWidth: 0,
  };

  const estiloRotulo = {
    display: "block",
    color: "#94A3B8",
    fontSize: "12px",
    marginBottom: "5px",
  };

  function colarFotografia(e) {
    const item = Array.from(e.clipboardData.items).find(
      (item) => item.type.startsWith("image/")
    );

    if (item) {
      const arquivo = item.getAsFile();
      if (arquivo) setFotografia(arquivo);
    }
  }

  function extrairCampo(texto, expressao) {
    const resultado = texto.match(expressao);
    return resultado ? resultado[1].trim() : "";
  }

  function interpretarDados() {
    const texto = textoConsulta
      .replace(/&nbsp;|&#xA0;|&#160;/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\*\*/g, "")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ");

    const nome = extrairCampo(
      texto,
      /Nome\s*:\s*(.*?)(?=\s+Pai\/Mãe\s*:|\s+Naturalidade\s*:|$)/i
    );

    const rg = extrairCampo(
      texto,
      /RG\s*:\s*([0-9.\/-]+)/i
    );

    const cpf = extrairCampo(
      texto,
      /CPF\s*:\s*([0-9.-]{11,14})/i
    );

    const nascimento = extrairCampo(
      texto,
      /Data\s*Nascimento\s*:\s*(\d{2}\/\d{2}\/\d{4})/i
    );

    const filiacao = extrairCampo(
      texto,
      /Pai\/Mãe\s*:\s*(.*?)(?=\s+Naturalidade\s*:|$)/i
    );

    const rua = extrairCampo(
      texto,
      /Endereço\s*:\s*(.*?)(?=\s+Bairro\s*:|$)/i
    );

    const bairro = extrairCampo(
      texto,
      /Bairro\s*:\s*(.*?)(?=\s+Município\s*\/\s*UF\s*:|$)/i
    );

    const municipio = extrairCampo(
      texto,
      /Município\s*\/\s*UF\s*:\s*(.*?)(?=\s+Nacionalidade\s*:|$)/i
    );

    const endereco = [rua, bairro, municipio]
      .filter(Boolean)
      .join(" - ");

    setDados((anterior) => ({
      ...anterior,
      nome,
      rg,
      cpf,
      nascimento,
      filiacao,
      endereco,
    }));

    setInterpretado(true);
  }

  function atualizarCampo(campo, valor) {
    setDados((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function campo(label, propriedade) {
    return (
      <div style={{ marginBottom: "10px" }}>
        <label style={estiloRotulo}>{label}</label>
        <input
          value={dados[propriedade]}
          onChange={(e) =>
            atualizarCampo(propriedade, e.target.value)
          }
          style={estiloCampo}
        />
      </div>
    );
  }

  function lerArquivoComoDataURL(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () =>
        reject(new Error("Não foi possível ler a fotografia."));

      leitor.readAsDataURL(arquivo);
    });
  }

  function obterDimensoesImagem(dataURL) {
    return new Promise((resolve, reject) => {
      const imagem = new Image();

      imagem.onload = () =>
        resolve({
          largura: imagem.naturalWidth,
          altura: imagem.naturalHeight,
        });

      imagem.onerror = () =>
        reject(new Error("Não foi possível processar a fotografia."));

      imagem.src = dataURL;
    });
  }

  function calcularTamanhoImagem(largura, altura, maxLargura, maxAltura) {
    const proporcao = Math.min(
      maxLargura / largura,
      maxAltura / altura,
      1
    );

    return [
      Math.round(largura * proporcao),
      Math.round(altura * proporcao),
    ];
  }

  function dataURLParaBinario(dataURL) {
    const base64 = dataURL.split(",")[1];
    return atob(base64);
  }

  async function gerarCartorial() {
    try {
      setGerando(true);

      // Carrega o modelo Word
      const resposta = await fetch("/modelos/modelo-cartorial.docx");

      if (!resposta.ok) {
        throw new Error(
          "Não foi possível localizar o modelo-cartorial.docx."
        );
      }

      const arquivoModelo = await resposta.arrayBuffer();
      const zip = new PizZip(arquivoModelo);

      const dadosDocumento = {
        nome: dados.nome || "",
        rg: dados.rg || "",
        alcunha: dados.alcunha || "",
        cpf: dados.cpf || "",
        orcrim: "",
        dn: dados.nascimento || "",
        situacao: "",
        cd: "",
        filiacao: dados.filiacao || "",
        end: dados.endereco || "",
        oc: ocorrencias || "",
        obs: observacoes || "",
        foto: "",
      };

      const opcoesDoc = {
  paragraphLoop: true,
  linebreaks: true,
  nullGetter: () => "",
  delimiters: {
    start: "{{",
    end: "}}",
  },
};

      let doc;

      if (fotografia) {
        const dataURL = await lerArquivoComoDataURL(fotografia);
        const dimensoes = await obterDimensoesImagem(dataURL);

        const imagemModule = new ImageModule({
          getImage: () => dataURLParaBinario(dataURL),

          getSize: () =>
            calcularTamanhoImagem(
              dimensoes.largura,
              dimensoes.altura,
              150,
              200
            ),
        });

        doc = new Docxtemplater(zip, {
          ...opcoesDoc,
          modules: [imagemModule],
        });

        dadosDocumento.foto = dataURL;
      } else {
        doc = new Docxtemplater(zip, opcoesDoc);
      }

      // Preenche o modelo
      doc.render(dadosDocumento);

      // Gera o arquivo Word
      const arquivoFinal = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Inicia o download
      const url = URL.createObjectURL(arquivoFinal);
      const link = document.createElement("a");

      link.href = url;
      link.download = `Cartorial_${dados.nome || "Sem_Nome"}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (erro) {
      console.error("Erro ao gerar Cartorial:", erro);
console.error("Detalhes do erro:", erro.properties?.errors || erro);

      alert(
        "Não foi possível gerar o Cartorial.\n\n" +
          (erro.message || "Verifique o modelo Word e tente novamente.")
      );
    } finally {
      setGerando(false);
    }
  }

  return (
    <div
      style={{
        color: "#fff",
        padding: "16px",
        background: "#0f172a",
        border: "1px solid #263449",
        borderRadius: "12px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          color: "#F1F5F9",
          fontSize: "19px",
          margin: "0 0 16px 0",
        }}
      >
        📄 Gerador de Cartorial
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        {/* CONSULTA INTEGRADA */}
        <div style={estiloPainel}>
          <h3 style={estiloTitulo}>
            Dados da consulta integrada
          </h3>

          <textarea
            value={textoConsulta}
            onChange={(e) => {
              setTextoConsulta(e.target.value);
              setInterpretado(false);
            }}
            placeholder="Cole aqui os dados da consulta integrada..."
            style={{
              ...estiloCampo,
              minHeight: "120px",
              resize: "vertical",
            }}
          />

          <button
            onClick={interpretarDados}
            style={{
              marginTop: "10px",
              padding: "9px 15px",
              background: "#2563EB",
              border: "1px solid #3B82F6",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Interpretar dados
          </button>

          {interpretado && (
            <p style={{ color: "#86EFAC", fontSize: "12px" }}>
              Leitura concluída. Confira os campos ao lado.
            </p>
          )}
        </div>

        {/* FOTOGRAFIA */}
        <div style={estiloPainel}>
          <h3 style={estiloTitulo}>Fotografia</h3>

          <div
            tabIndex={0}
            onPaste={colarFotografia}
            style={{
              width: "100%",
              minHeight: "120px",
              border: "2px dashed #52627a",
              borderRadius: "8px",
              padding: "8px",
              boxSizing: "border-box",
              textAlign: "center",
              cursor: "pointer",
              background: "#1e293b",
              color: "#CBD5E1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {fotografia ? (
              <img
                src={URL.createObjectURL(fotografia)}
                alt="Fotografia selecionada"
                style={{
                  maxHeight: "115px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <p style={{ fontSize: "13px", margin: 0 }}>
                Clique aqui e pressione Ctrl + V para colar
                uma fotografia
              </p>
            )}
          </div>

          <p
            style={{
              color: "#94A3B8",
              fontSize: "12px",
              margin: "8px 0 5px 0",
            }}
          >
            Ou selecione uma imagem do computador:
          </p>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 14px",
              background: "#334155",
              border: "1px solid #52627a",
              borderRadius: "8px",
              color: "#F1F5F9",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <span>📁 Selecionar fotografia</span>

            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) =>
                setFotografia(e.target.files?.[0] || null)
              }
              style={{ display: "none" }}
            />
          </label>

          {fotografia && (
            <p
              style={{
                color: "#94A3B8",
                fontSize: "11px",
                margin: "6px 0 0 0",
              }}
            >
              {fotografia.name}
            </p>
          )}
        </div>

        {/* IDENTIFICAÇÃO */}
        <div style={estiloPainel}>
          <h3 style={estiloTitulo}>Identificação</h3>

          {campo("NOME", "nome")}
          {campo("RG", "rg")}
          {campo("ALCUNHA", "alcunha")}
          {campo("CPF", "cpf")}
          {campo("DATA DE NASCIMENTO", "nascimento")}
        </div>

        {/* DADOS COMPLEMENTARES */}
        <div style={estiloPainel}>
          <h3 style={estiloTitulo}>Dados complementares</h3>

          <div style={{ marginBottom: "10px" }}>
            <label style={estiloRotulo}>FILIAÇÃO</label>
            <textarea
              value={dados.filiacao}
              onChange={(e) =>
                atualizarCampo("filiacao", e.target.value)
              }
              style={{
                ...estiloCampo,
                minHeight: "75px",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label style={estiloRotulo}>ENDEREÇO</label>
            <textarea
              value={dados.endereco}
              onChange={(e) =>
                atualizarCampo("endereco", e.target.value)
              }
              style={{
                ...estiloCampo,
                minHeight: "75px",
                resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* OCORRÊNCIAS */}
        <div style={estiloPainel}>
          <h3 style={estiloTitulo}>Ocorrências (OC.)</h3>

          <textarea
            value={ocorrencias}
            onChange={(e) => setOcorrencias(e.target.value)}
            placeholder="Insira as ocorrências..."
            style={{
              ...estiloCampo,
              minHeight: "100px",
              resize: "vertical",
            }}
          />
        </div>

        {/* OBSERVAÇÕES */}
        <div style={estiloPainel}>
          <h3 style={estiloTitulo}>Observações (OBS.)</h3>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Insira as observações..."
            style={{
              ...estiloCampo,
              minHeight: "100px",
              resize: "vertical",
            }}
          />
        </div>
      </div>

      {/* GERAR DOCUMENTO */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "16px",
        }}
      >
        <button
          onClick={gerarCartorial}
          disabled={gerando}
          style={{
            padding: "12px 22px",
            background: gerando ? "#475569" : "#15803D",
            border: "1px solid #22C55E",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "700",
            cursor: gerando ? "wait" : "pointer",
            opacity: gerando ? 0.7 : 1,
          }}
        >
          {gerando
            ? "GERANDO DOCUMENTO..."
            : "📄 GERAR CARTORIAL (.DOCX)"}
        </button>
      </div>
    </div>
  );
}
