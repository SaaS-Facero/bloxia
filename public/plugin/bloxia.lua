--[[
  Bloxia — Plugin Roblox Studio
  Installe automatiquement les scripts de ton pack Bloxia dans ton jeu.
  Colle ton code d'appairage (depuis ton espace getbloxia.com) et clique « Installer ».
  Plugin original Bloxia. Non affilié à Roblox Corporation.
]]

local API = "https://www.getbloxia.com"

local HttpService = game:GetService("HttpService")
local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterPlayer = game:GetService("StarterPlayer")
local StarterGui = game:GetService("StarterGui")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

-- ---------- barre d'outils + bouton ----------
local toolbar = plugin:CreateToolbar("Bloxia")
local button = toolbar:CreateButton("Bloxia", "Installe ton pack Bloxia dans ton jeu", "rbxassetid://0", "Bloxia")
button.ClickableWhenViewportHidden = true

local widgetInfo = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 360, 520, 300, 420)
local widget = plugin:CreateDockWidgetPluginGui("BloxiaMain", widgetInfo)
widget.Title = "Bloxia"

-- ---------- helpers UI ----------
local INK = Color3.fromRGB(233, 237, 247)
local INK2 = Color3.fromRGB(150, 160, 180)
local BG = Color3.fromRGB(13, 16, 32)
local CARD = Color3.fromRGB(20, 24, 41)
local GOLD = Color3.fromRGB(255, 197, 61)
local GREEN = Color3.fromRGB(43, 214, 143)
local RED = Color3.fromRGB(255, 107, 107)
local ACC = Color3.fromRGB(79, 107, 237)

local function corner(inst, r) local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, r or 10); c.Parent = inst end
local function pad(inst, p) local u = Instance.new("UIPadding"); u.PaddingLeft = UDim.new(0, p); u.PaddingRight = UDim.new(0, p); u.PaddingTop = UDim.new(0, p); u.PaddingBottom = UDim.new(0, p); u.Parent = inst end

local root = Instance.new("Frame")
root.Size = UDim2.new(1, 0, 1, 0)
root.BackgroundColor3 = BG
root.BorderSizePixel = 0
root.Parent = widget

local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, 0, 1, 0)
scroll.BackgroundTransparency = 1
scroll.BorderSizePixel = 0
scroll.ScrollBarThickness = 6
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = root
pad(scroll, 16)

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 12)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = scroll

local order = 0
local function next() order = order + 1; return order end

local function label(text, size, color, weight)
  local t = Instance.new("TextLabel")
  t.BackgroundTransparency = 1
  t.Size = UDim2.new(1, 0, 0, 0)
  t.AutomaticSize = Enum.AutomaticSize.Y
  t.Font = weight or Enum.Font.Gotham
  t.TextSize = size or 14
  t.TextColor3 = color or INK
  t.TextXAlignment = Enum.TextXAlignment.Left
  t.TextWrapped = true
  t.Text = text
  t.LayoutOrder = next()
  t.Parent = scroll
  return t
end

label("Bloxia", 22, INK, Enum.Font.GothamBold)
local sub = label("Connecte ton compte et installe tous tes scripts d'un coup.", 13, INK2)

-- champ code
label("TON CODE D'APPAIRAGE", 11, INK2, Enum.Font.GothamMedium)
local box = Instance.new("TextBox")
box.Size = UDim2.new(1, 0, 0, 44)
box.BackgroundColor3 = CARD
box.BorderSizePixel = 0
box.Font = Enum.Font.GothamMedium
box.TextSize = 16
box.TextColor3 = INK
box.PlaceholderText = "Ex : 4F2A9C1B"
box.PlaceholderColor3 = INK2
box.Text = plugin:GetSetting("bloxiaCode") or ""
box.ClearTextOnFocus = false
box.LayoutOrder = next()
box.Parent = scroll
corner(box, 10)
pad(box, 10)

-- bouton installer
local btn = Instance.new("TextButton")
btn.Size = UDim2.new(1, 0, 0, 48)
btn.BackgroundColor3 = GOLD
btn.BorderSizePixel = 0
btn.Font = Enum.Font.GothamBold
btn.TextSize = 16
btn.TextColor3 = Color3.fromRGB(16, 16, 26)
btn.Text = "Installer dans mon jeu"
btn.AutoButtonColor = true
btn.LayoutOrder = next()
btn.Parent = scroll
corner(btn, 12)

local status = label("", 13, INK2)
status.Visible = false

-- zone de journal
local logBox = Instance.new("Frame")
logBox.Size = UDim2.new(1, 0, 0, 0)
logBox.AutomaticSize = Enum.AutomaticSize.Y
logBox.BackgroundColor3 = CARD
logBox.BorderSizePixel = 0
logBox.LayoutOrder = next()
logBox.Visible = false
logBox.Parent = scroll
corner(logBox, 10)
pad(logBox, 12)
local logList = Instance.new("UIListLayout")
logList.Padding = UDim.new(0, 4)
logList.Parent = logBox

local function logLine(text, color)
  logBox.Visible = true
  local t = Instance.new("TextLabel")
  t.BackgroundTransparency = 1
  t.Size = UDim2.new(1, 0, 0, 0)
  t.AutomaticSize = Enum.AutomaticSize.Y
  t.Font = Enum.Font.Code
  t.TextSize = 12
  t.TextColor3 = color or INK2
  t.TextXAlignment = Enum.TextXAlignment.Left
  t.TextWrapped = true
  t.Text = text
  t.Parent = logBox
end

local function setStatus(text, color)
  status.Visible = true
  status.Text = text
  status.TextColor3 = color or INK2
end

-- ---------- logique d'installation ----------
local function serviceFor(ou)
  ou = string.lower(ou or "")
  if string.find(ou, "replicatedstorage") then return ReplicatedStorage end
  if string.find(ou, "starterplayerscripts") then return StarterPlayer:FindFirstChild("StarterPlayerScripts") end
  if string.find(ou, "startergui") then return StarterGui end
  return ServerScriptService
end

local function classFor(t)
  t = string.lower(t or "")
  if string.find(t, "module") then return "ModuleScript" end
  if string.find(t, "local") then return "LocalScript" end
  return "Script"
end

local function install()
  local code = string.upper((box.Text or ""):gsub("%s", ""))
  if #code < 6 then setStatus("Entre ton code d'appairage (dans ton espace Bloxia).", RED); return end
  plugin:SetSetting("bloxiaCode", code)
  btn.Text = "Installation…"
  btn.BackgroundColor3 = INK2
  setStatus("Connexion à Bloxia…", INK2)
  for _, c in ipairs(logBox:GetChildren()) do if c:IsA("TextLabel") then c:Destroy() end end

  local ok, res = pcall(function()
    return HttpService:GetAsync(API .. "/api/plugin/pack?code=" .. code, true)
  end)
  if not ok then
    setStatus("Connexion impossible. Active les requêtes HTTP du plugin (Studio demande l'autorisation) puis réessaie.", RED)
    btn.Text = "Installer dans mon jeu"; btn.BackgroundColor3 = GOLD; return
  end
  local data
  local okd = pcall(function() data = HttpService:JSONDecode(res) end)
  if not okd or not data or not data.scripts then
    setStatus("Code invalide ou expiré. Récupère un nouveau code dans ton espace Bloxia.", RED)
    btn.Text = "Installer dans mon jeu"; btn.BackgroundColor3 = GOLD; return
  end

  ChangeHistoryService:SetWaypoint("Avant Bloxia")
  local count, replaced = 0, 0
  for _, s in ipairs(data.scripts) do
    local parent = serviceFor(s.ou)
    if parent then
      local existing = parent:FindFirstChild(s.nom)
      if existing and (existing:IsA("Script") or existing:IsA("LocalScript") or existing:IsA("ModuleScript")) then
        existing.Source = s.code
        replaced = replaced + 1
        logLine("↻ " .. s.nom .. " (mis à jour)", GREEN)
      else
        local inst = Instance.new(classFor(s.type))
        inst.Name = s.nom
        inst.Source = s.code
        inst.Parent = parent
        count = count + 1
        logLine("✓ " .. s.nom .. " → " .. parent.Name, GREEN)
      end
    else
      logLine("! " .. s.nom .. " : emplacement introuvable", RED)
    end
  end
  ChangeHistoryService:SetWaypoint("Bloxia installé")

  setStatus(("Terminé : %d script(s) installé(s), %d mis à jour. Tu peux lancer ton jeu."):format(count, replaced), GREEN)
  btn.Text = "Réinstaller / mettre à jour"; btn.BackgroundColor3 = GOLD

  if data.prompts and #data.prompts > 0 then
    logLine("", INK2)
    logLine("Pour la map : ouvre l'Assistant Roblox (Create > Assistant) et colle les prompts de ton espace Bloxia.", INK2)
  end
end

btn.MouseButton1Click:Connect(install)

-- lien aide
local help = label("Besoin du code ? Ouvre ton espace sur getbloxia.com → Roblox Studio.", 12, INK2)

-- ---------- ouverture ----------
local function toggle() widget.Enabled = not widget.Enabled; button:SetActive(widget.Enabled) end
button.Click:Connect(toggle)
button:SetActive(widget.Enabled)
