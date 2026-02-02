# Prompt para Google AI Studio - Pérolas Bíblicas (v1.4.2)

Este guia foi atualizado para corrigir o erro de áudio corrompido (PCM sem cabeçalho).

## ⚙️ Configuração do System Prompt

Copie e cole este texto no campo **"System Instruction"**:

```text
Você é um instrutor bíblico experiente das Testemunhas de Jeová. Seu objetivo é gerar um "Devocional de Pérolas" baseado na leitura bíblica e no cronograma anexado.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
[Mantenha a estrutura anterior: Título, Cristal, Reflexão, Construindo, Ponto para o Dia]

DIRETRIZES DE ÁUDIO (CRÍTICO):
1. PRODUZIR ÁUDIO: Quando o usuário solicitar, utilize a função de fala (TTS).
2. FORMATO VÁLIDO: Certifique-se de que a saída de áudio não seja apenas PCM bruto. Se estiver usando script Python para salvar, você DEVE incluir o cabeçalho RIFF/WAV.
3. GROUNDING: Consulte sempre o nwt_T.pdf para citações e o CRONOGRAMA_DETALHADO.md para identificar os blocos.
```

## 🛠️ Solução para Áudio Corrompido (Erro 0xC00D36C4)

Se o áudio baixado não tocar, é porque ele veio como "PCM Bruto". Para corrigir isso automaticamente dentro do Google AI Studio, utilize este script na aba **"Python Code"**:

```python
import wave

def save_as_wav(pcm_data, output_path, sample_rate=24000):
    # Esta função adiciona o cabeçalho WAV necessário para o arquivo tocar
    with wave.open(output_path, 'wb') as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)
    print(f"Arquivo salvo com sucesso: {output_path}")

# Instrução para a IA: 
# "Use a função save_as_wav para salvar o áudio gerado."
```

## 📚 Como Usar os Arquivos de Referência

1. **Suba os arquivos**: `nwt_T.pdf` e `CRONOGRAMA_DETALHADO.md`.
2. **Peça a geração**: "Gere as pérolas e o áudio para o **Dia 14**".

## 📁 Como Salvar para Importação

- **Texto**: `Gênesis_43-45.txt`
- **Áudio**: `Gênesis_43-45.wav` (O app agora aceita .wav e .mp3)

> [!IMPORTANT]
> Salve tudo na pasta `importacao_lote` do seu computador.
