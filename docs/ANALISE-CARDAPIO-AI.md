# Análise completa do cardapio.ai — Especificação de paridade

> Levantamento de **todas** as funcionalidades observadas no cardapio.ai (loja
> "cariri burgues"), para reconstrução com layout próprio (dark "smokehouse").
> **Fora de escopo:** Fiscal (NFC-e) e Integrações de terceiros.
> O Robô de WhatsApp (sessão WhatsApp Web) fica como opcional.

## A. Visão do CLIENTE (cardápio online)

### Home / Linktree (`Meus links`)
- Capa, logo, nome da loja.
- Botões: **Ver cardápio** (entrega/retirada), **Pedir na mesa** (cardápio local).
- Links personalizados externos (WhatsApp, iFood…), com toggle de exibição.
- Compartilhar.

### Vitrine do cardápio
- Cabeçalho: capa, logo, nome, **Aberto agora / Ver horários**, **Pedido mínimo**.
- Busca por produto.
- **Categorias** (chips com emoji) + "Ver todas".
- **Destaques** (carrossel).
- Lista por categoria: card (imagem, nome, porção/peso, serve X, preço, descrição, botão +).
- Navegação inferior: Itens · Busca · Carrinho.

### Modal do produto
- Galeria de imagens, "Serve X pessoas", peso/medida, descrição.
- **Grupos de adicionais/complementos** (pagos e gratуitos), com regras
  (obrigatório, mín/máx) definidas por produto.
- Itens de grupo com +/- (quantidade por item).
- **Remoção de ingredientes** ("Deseja remover algum ingrediente?").
- Campo **observação** ("Alguma observação?").
- Stepper de quantidade. Nota "Adicionais multiplicados ao incluir +1 item".
- Botão **Adicionar** com total dinâmico.

### Carrinho / Checkout
- Itens editáveis (✏️ editar, +/- quantidade).
- **Entregar em** (endereço) + **Alterar** (→ editar endereço / mudar para retirada).
- **Previsão** de entrega + **Agendar** (pedido agendado).
- Detalhes da conta: Subtotal, Frete (ou GRÁTIS!), Total.
- **Cupom** ("Possui cupom?").
- **Identificação**: nome, telefone.
- **Endereço**: CEP (autopreenche), rua, número, bairro, cidade, complemento/referência.
- Tipos: **Delivery / Retirada / Mesa**.
- **Pagamento**: Dinheiro (+ troco para / não preciso de troco), Pix, Crédito, Débito.
- **Fazer pedido** → cria pedido + (mensagem WhatsApp) + acompanhamento de status.

## B. Painel da LOJA

### Início (Dashboard)
- Faturamento, Total de pedidos, Clientes totais, Ticket médio.
- Pedidos/Receita últimos 7 dias. Ocultar valores. Criar usuários com acesso limitado.

### Caixa
- Abrir/fechar caixa diário. Saldo de abertura.
- Movimentação: vendas em dinheiro, **Entradas**, **Saídas** (+ histórico).
- Em caixa esperado vs informado, **Diferença**. Desconto automático de troco.
- Fechamento com conferência + observação. Histórico de operações.

### Pedidos (Vendas) — Kanban
- Colunas: **Novos → Em preparo → Saiu pra entrega → Concluídos** (total por coluna).
- Abas: **Todos / Delivery / Mesas / Retirada**.
- Atualização automática, **Confirmação automática** (toggle).
- Busca (nome/código), filtro de período (Hoje-24h…), **+ Criar pedido**.
- Impressão automática (módulo desktop).
- **Detalhe do pedido**: stepper de status + "Avançar"; **entregador**;
  cliente (badge "1º pedido", anotações internas, WhatsApp); endereço + Maps/Waze +
  copiar links; itens (atualizar itens); pagamento (subtotal/frete/taxa/total); imprimir;
  ⋮ (cancelar, etc.). Código tipo `001-291962`.

### Mesas (salão / presencial)
- Grid de mesas, **Livres/Ocupadas**, modo **Mesa única / Comanda**, nº de mesas.
- Abrir mesa → PDV.

### PDV (Novo pedido / Criar pedido)
- Tipo: **Delivery / Mesa-Balcão / Retirada**.
- Cliente, Mesa, Comanda, **Atendente**.
- **Gorjeta sugerida** (%). **Acréscimo / Desconto**. Cupom.
- Seletor de produtos por categoria. Salvar / **Salvar e imprimir**.

### Produtos
- Categorias (Nova categoria, ordenar). **Destaques** (até 6). **Valores especiais**.
- Tipos: **Comum / Combo (agrupa produtos) / Pizza (cobrança avançada, sabores) / Peso (por kg)**.
- Por produto: múltiplas imagens, título, **Cod. PDV**, **Preço + desconto**,
  **Medida** (g/ml/un), serve X, **Estoque**, descrição, **Etiquetas**,
  **disponibilidade por canal** (Entrega/retirada vs Mesa/balcão),
  **Remoção de ingredientes**, **grupos de adicionais**. Duplicar/Excluir.

### Adicionais
- **Grupos reutilizáveis** (título, descrição, disponível, ordenar, copiar).
- Itens: imagem, nome, descrição, **preço**, **Cod. PDV**, **Estoque**, disponível.
- Regras (obrigatório, mín/máx) definidas ao vincular no produto.

### Clientes
- **Cashback** (taxa %, prazo de validade) para fidelização.
- Métricas: Total, Pedidos, Ticket médio, Recorrência média.
- Segmentação: **Novos / Recorrentes / Em risco / Inativos** (definições por período).
- Lista, filtro, **Importar** / **Novo** / **Exportar CSV**. Perfil + anotações internas.

### Relatórios
- Abas: **Caixa / Itens / Pagamentos / Entregadores**. Período. **Baixar PDF**.
- Faturamento (vendas, taxas de entrega, gorjetas, total). Vendas por canal e cancelados.

### Entrega
- Modalidade de frete: **Faixas por Km / Por bairro / Fixo**.
- Tempo de preparo (somado ao transporte). **Frete grátis acima de X**.
- Mapa de confirmação de endereço. Faixas (raio/taxa/prazo/atendimento).
- Aba **Entregadores** (cadastro).

### Pagamento
- **Presencial**: Pix, Dinheiro, Crédito, Débito, Vale Refeição, Vale Alimentação —
  toggles **Entrega/Retirada** + **Taxa extra**. Bandeiras aceitas.
- **Pix estático** (chave + tipo, envio de comprovante).
- Online (integração) — fora de escopo.

### Cupons
- Código (ou aleatório), **R$ ou %**, preço mínimo, **frete grátis**,
  limite por cliente, limite geral, validade (período).

### Horários
- Múltiplos **períodos**, cada um aplicado a dias da semana, início/fim.

### QR Code
- **Pedidos Online** (QR do cardápio) e **Pedidos Mesa** (QR por mesa). Baixar.

### Minha loja
- Informações: nome fantasia, CNPJ/CPF, WhatsApp, pedido mínimo, endereço.
- **Personalização**: cor primária (da logo), capa, logo; temas.
- Acesso rápido: Áreas de entrega, Controle de acessos, Chave Pix, Cashback,
  Impressão, Importar produtos, Recado no carrinho, Tutoriais.

### Controle de acessos
- Usuários com permissões por área (Owner/Manager/Staff).

### WhatsApp (opcional)
- Robô de pedidos + Central de alertas (notifica novos pedidos). Conexão via QR.
