// EpiMatcher — serviço de comparação de digitais (SourceAFIS, open-source Apache-2.0).
//
// Compara uma digital AO VIVO (sonda) contra as amostras CADASTRADAS do colaborador e
// devolve o melhor score + se deu match. Roda no .107 como um container; o Next.js chama
// via HTTP interno. NÃO depende de SDK proprietário nem do SGG.
//
// ⚠️ Confira a API do SourceAFIS contra a versão do NuGet instalado e CALIBRE o THRESHOLD
// com dedos reais (FAR/FRR). SourceAFIS recomenda score >= ~40 p/ FAR ~0,01% — ponto de
// partida; ajuste. As imagens vêm do leitor DigitalPersona (PNG, ~500 dpi).

using SourceAFIS;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

const double THRESHOLD = 40.0;   // calibrar!
const double DPI = 500.0;        // U.are.U 4500 = 500 dpi

FingerprintTemplate ToTemplate(string base64)
{
    var bytes = Convert.FromBase64String(base64.Trim());
    var image = new FingerprintImage(bytes, new FingerprintImageOptions { Dpi = DPI });
    return new FingerprintTemplate(image);
}

app.MapGet("/health", () => Results.Ok(new { ok = true }));

// { "sonda": "<png b64>", "amostras": ["<png b64>", ...] } -> { ok, match, score }
app.MapPost("/comparar", (CompararReq req) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(req.Sonda) || req.Amostras is null || req.Amostras.Length == 0)
            return Results.Ok(new { ok = false, erro = "sonda e amostras são obrigatórias" });

        var probe = ToTemplate(req.Sonda);
        var matcher = new FingerprintMatcher(probe);

        double best = 0;
        foreach (var a in req.Amostras)
        {
            if (string.IsNullOrWhiteSpace(a)) continue;
            var score = matcher.Match(ToTemplate(a));
            if (score > best) best = score;
        }
        return Results.Ok(new { ok = true, match = best >= THRESHOLD, score = best, threshold = THRESHOLD });
    }
    catch (Exception e)
    {
        return Results.Ok(new { ok = false, erro = e.Message });
    }
});

app.Run("http://0.0.0.0:8080");

record CompararReq(string Sonda, string[] Amostras);
