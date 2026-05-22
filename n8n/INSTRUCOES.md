# Workflows n8n

Os arquivos de workflow ficam nesta pasta:

|Arquivo|Importar em|
|-|-|
|`vps1-atendimento.json`|n8n VPS1 (n8n.neurautomation.com)|
|`vps2-acaraje.json`|n8n VPS2 (acarajevps-n8n.9wtaei.easypanel.host)|
|`notif-pronto.json`|n8n VPS2|

⚠️ Os arquivos `vps1-atendimento.json` e `vps2-acaraje.json` já foram fornecidos
anteriormente. Salve-os aqui. Depois de importar, preencha os secrets no nó ⚙️ Configurações:

```
SUPABASE\\\_SERVICE\\\_KEY  ← Settings > API > service\\\_role no Supabase
WA\\\_TOKEN              ← Meta Business Manager > System Users  
ASAAS\\\_API\\\_KEY         ← Painel Asaas > API Keys
CARDAPIO\\\_URL          ← URL do Vercel após deploy (com / no final)
```

## Secrets extras para notif-pronto.json

```
WA\\\_TOKEN  ← mesmo token acima (preencher no nó ⚙️ Config WA)
```

