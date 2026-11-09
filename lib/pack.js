// Pack complet livré après paiement. Généré côté serveur à partir des réponses du funnel : jamais exposé dans le JS public.
// Les scripts Luau restent compatibles avec la syntaxe Lua 5.1 (pas de +=, pas de types) pour être vérifiables automatiquement.

const THEMES = {
  lava: { fr: 'Volcan', en: 'Volcano', world: 'a volcanic world with dark basalt rock and glowing orange lava', ground: '#3a2a2e', rock: '#5a3a38', accent: '#ff6a3d', mood: 'rouge et orange, fumée, lueurs de lave' },
  snow: { fr: 'Glace', en: 'Frozen', world: 'a frozen world with snow, ice cliffs and pine trees', ground: '#dfeaf7', rock: '#a9c3de', accent: '#7fc4ff', mood: 'bleu glacier, blanc, brume froide' },
  city: { fr: 'Ville', en: 'Neon', world: 'a neon city at night with tall buildings and glowing signs', ground: '#3b4256', rock: '#262b3a', accent: '#8f6bff', mood: 'violet et cyan néon, nuit, reflets' },
  space: { fr: 'Espace', en: 'Cosmic', world: 'an alien planet in space with craters, crystals and a starry sky', ground: '#6b6f85', rock: '#454a63', accent: '#9b7bff', mood: 'violet profond, cristaux lumineux, ciel étoilé' },
  horror: { fr: 'Horreur', en: 'Haunted', world: 'a haunted, foggy place at night with dead trees and old buildings', ground: '#34402f', rock: '#222a22', accent: '#7bd88a', mood: 'vert sombre, brouillard épais, lumière froide' },
  island: { fr: 'Île', en: 'Island', world: 'a tropical island with sand beaches, palm trees and turquoise water', ground: '#f0d9a0', rock: '#c9a96b', accent: '#47d1ff', mood: 'turquoise, sable doré, soleil' },
  jungle: { fr: 'Jungle', en: 'Jungle', world: 'a dense jungle with ancient stone temples, vines and a river', ground: '#3f8f4a', rock: '#2a6a35', accent: '#47e08a', mood: 'vert profond, pierre ancienne, rayons de soleil' },
  candy: { fr: 'Bonbons', en: 'Candy', world: 'a candy land made of giant sweets, lollipops and chocolate rivers', ground: '#ff9ccf', rock: '#e870b0', accent: '#ff7ad1', mood: 'rose bonbon, pastel, brillant' },
  grass: { fr: 'Prairie', en: 'Meadow', world: 'green meadows with rolling hills, flowers and small rivers', ground: '#5fbf5a', rock: '#8a8f99', accent: '#5b8cff', mood: 'vert frais, ciel bleu, lumière douce' }
};
const GENRES = {
  obby: { fr: 'obby', label: 'Obby', en: 'obby (obstacle course)', word: 'Rush' },
  tycoon: { fr: 'tycoon', label: 'Tycoon', en: 'tycoon', word: 'Factory' },
  simulator: { fr: 'simulator', label: 'Simulator', en: 'collecting simulator', word: 'Simulator' },
  horror: { fr: 'jeu d\'horreur', label: 'Horreur', en: 'survival horror', word: 'Survival' },
  td: { fr: 'tower defense', label: 'Tower Defense', en: 'tower defense', word: 'Defense' },
  rp: { fr: 'roleplay', label: 'Roleplay', en: 'roleplay town', word: 'Life' }
};

// ---------------------------------------------------------------------------------------------
// Scripts communs
// ---------------------------------------------------------------------------------------------
const luaTable = o => '{ ' + Object.entries(o).map(([k, v]) => `${k} = ${typeof v === 'string' ? JSON.stringify(v) : (typeof v === 'object' ? luaTable(v) : v)}`).join(', ') + ' }';

const dataManager = defaults => `-- DataManager : sauvegarde des joueurs (ModuleScript)
-- Où : ServerScriptService > DataManager (ModuleScript)
-- Rôle : charge et sauvegarde les données de chaque joueur, avec réessais automatiques.
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")

local STORE = DataStoreService:GetDataStore("BloxiaData_v1")
local DEFAULTS = ${luaTable(defaults)}
local AUTOSAVE_SECONDS = 120

local DataManager = {}
local cache = {}
local changed = Instance.new("BindableEvent")
DataManager.Changed = changed.Event -- (player, cle, valeur)

local function deepCopy(t)
	local out = {}
	for k, v in pairs(t) do
		if type(v) == "table" then out[k] = deepCopy(v) else out[k] = v end
	end
	return out
end

local function withRetry(fn)
	for attempt = 1, 4 do
		local ok, result = pcall(fn)
		if ok then return true, result end
		warn("[DataManager] tentative " .. attempt .. " échouée : " .. tostring(result))
		task.wait(attempt * 2)
	end
	return false, nil
end

function DataManager.Load(player)
	local key = "player_" .. player.UserId
	local ok, data = withRetry(function() return STORE:GetAsync(key) end)
	if not ok then
		player:Kick("Ta sauvegarde n'a pas pu être chargée. Reviens dans une minute.")
		return nil
	end
	data = data or {}
	for k, v in pairs(DEFAULTS) do
		if data[k] == nil then
			if type(v) == "table" then data[k] = deepCopy(v) else data[k] = v end
		end
	end
	if type(data.Purchases) ~= "table" then data.Purchases = {} end
	cache[player] = data
	return data
end

function DataManager.Get(player)
	return cache[player]
end

function DataManager.Set(player, key, value)
	local data = cache[player]
	if not data then return end
	data[key] = value
	changed:Fire(player, key, value)
end

function DataManager.Add(player, key, amount)
	local data = cache[player]
	if not data then return end
	DataManager.Set(player, key, (data[key] or 0) + amount)
end

function DataManager.Save(player)
	local data = cache[player]
	if not data then return false end
	local key = "player_" .. player.UserId
	local ok = withRetry(function()
		STORE:UpdateAsync(key, function() return data end)
	end)
	return ok
end

Players.PlayerRemoving:Connect(function(player)
	DataManager.Save(player)
	cache[player] = nil
end)

game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(DataManager.Save, player)
	end
	task.wait(3)
end)

task.spawn(function()
	while true do
		task.wait(AUTOSAVE_SECONDS)
		for _, player in ipairs(Players:GetPlayers()) do
			task.spawn(DataManager.Save, player)
		end
	end
end)

return DataManager
`;

const playerSetup = stats => `-- PlayerSetup : charge le joueur et affiche ses stats (Script)
-- Où : ServerScriptService > PlayerSetup (Script)
local Players = game:GetService("Players")
local DataManager = require(script.Parent:WaitForChild("DataManager"))

local SHOWN = ${'{ ' + stats.map(s => JSON.stringify(s)).join(', ') + ' }'} -- stats visibles dans le classement

local function onPlayerAdded(player)
	local data = DataManager.Load(player)
	if not data then return end
	local folder = Instance.new("Folder")
	folder.Name = "leaderstats"
	for _, name in ipairs(SHOWN) do
		local value = Instance.new("IntValue")
		value.Name = name
		value.Value = math.floor(data[name] or 0)
		value.Parent = folder
	end
	folder.Parent = player
	player:SetAttribute("DataLoaded", true)
end

DataManager.Changed:Connect(function(player, key, value)
	local folder = player:FindFirstChild("leaderstats")
	local stat = folder and folder:FindFirstChild(key)
	if stat and type(value) == "number" then stat.Value = math.floor(value) end
end)

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in ipairs(Players:GetPlayers()) do task.spawn(onPlayerAdded, player) end
`;

const configModule = (title, items) => `-- BloxiaConfig : réglages et identifiants de la boutique (ModuleScript)
-- Où : ReplicatedStorage > BloxiaConfig (ModuleScript)
-- À faire : remplace chaque 0 par l'ID de ton Game Pass ou de ton produit développeur (Creator Hub > Monétisation).
local Config = {}

Config.GameName = ${JSON.stringify(title)}

Config.Items = {
${items.map(i => `	{ Key = "${i.key}", Name = ${JSON.stringify(i.name)}, Kind = "${i.kind}", Price = ${i.price}, Id = 0, Description = ${JSON.stringify(i.effect)} },`).join('\n')}
}

return Config
`;

const shopServer = (effectsLua, passApplyLua) => `-- ShopServer : Game Passes et produits développeur (Script)
-- Où : ServerScriptService > ShopServer (Script)
-- Rôle : vérifie les Game Passes, accorde les achats de façon sûre (ProcessReceipt) et applique les effets.
local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataManager = require(script.Parent:WaitForChild("DataManager"))
local Config = require(ReplicatedStorage:WaitForChild("BloxiaConfig"))

local passKeyById, productKeyById = {}, {}
for _, item in ipairs(Config.Items) do
	if item.Id ~= 0 then
		if item.Kind == "pass" then passKeyById[item.Id] = item.Key else productKeyById[item.Id] = item.Key end
	else
		warn("[Boutique] ID manquant pour " .. item.Name .. " : remplace le 0 dans BloxiaConfig.")
	end
end

-- Effets des produits développeur (achats répétables)
local ProductEffects = {}
${effectsLua}

-- Effets des Game Passes (achats uniques, appliqués à chaque connexion)
local function applyPass(player, key)
	player:SetAttribute("Pass_" .. key, true)
${passApplyLua}
end

local function checkPasses(player)
	for id, key in pairs(passKeyById) do
		local ok, owns = pcall(function() return MarketplaceService:UserOwnsGamePassAsync(player.UserId, id) end)
		if ok and owns then applyPass(player, key) end
	end
end

Players.PlayerAdded:Connect(function(player)
	while not player:GetAttribute("DataLoaded") and player.Parent do task.wait(0.2) end
	checkPasses(player)
end)

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
	local key = passKeyById[passId]
	if purchased and key then applyPass(player, key) end
end)

-- Achat de produits : n'accorde qu'une fois par reçu, et ne confirme qu'après la sauvegarde.
MarketplaceService.ProcessReceipt = function(receipt)
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
	local data = DataManager.Get(player)
	if not data then return Enum.ProductPurchaseDecision.NotProcessedYet end
	if data.Purchases[receipt.PurchaseId] then return Enum.ProductPurchaseDecision.PurchaseGranted end
	local key = productKeyById[receipt.ProductId]
	local effect = key and ProductEffects[key]
	if not effect then
		warn("[Boutique] produit inconnu : " .. tostring(receipt.ProductId))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local ok, err = pcall(effect, player, data)
	if not ok then
		warn("[Boutique] erreur pendant l'achat : " .. tostring(err))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	data.Purchases[receipt.PurchaseId] = true
	if not DataManager.Save(player) then
		data.Purchases[receipt.PurchaseId] = nil
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	return Enum.ProductPurchaseDecision.PurchaseGranted
end
`;

const shopClient = accent => `-- ShopClient : bouton et fenêtre de boutique, adaptés au mobile (LocalScript)
-- Où : StarterPlayer > StarterPlayerScripts > ShopClient (LocalScript)
local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("BloxiaConfig"))

local player = Players.LocalPlayer
local ACCENT = Color3.fromHex("${accent}")

local gui = Instance.new("ScreenGui")
gui.Name = "BloxiaShop"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = player:WaitForChild("PlayerGui")

local function corner(parent, radius)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
end

local open = Instance.new("TextButton")
open.Size = UDim2.fromOffset(150, 54)
open.Position = UDim2.new(0, 16, 0.5, -27)
open.BackgroundColor3 = ACCENT
open.Text = "Boutique"
open.TextColor3 = Color3.new(1, 1, 1)
open.Font = Enum.Font.GothamBold
open.TextSize = 22
open.Parent = gui
corner(open, 14)

local panel = Instance.new("Frame")
panel.Size = UDim2.new(0.9, 0, 0.7, 0)
panel.Position = UDim2.fromScale(0.5, 0.5)
panel.AnchorPoint = Vector2.new(0.5, 0.5)
panel.BackgroundColor3 = Color3.fromRGB(14, 16, 26)
panel.Visible = false
panel.Parent = gui
corner(panel, 18)
local limit = Instance.new("UISizeConstraint")
limit.MaxSize = Vector2.new(520, 560)
limit.Parent = panel

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -70, 0, 56)
title.Position = UDim2.fromOffset(20, 8)
title.BackgroundTransparency = 1
title.Text = "Boutique"
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextColor3 = Color3.new(1, 1, 1)
title.Font = Enum.Font.GothamBlack
title.TextSize = 28
title.Parent = panel

local close = Instance.new("TextButton")
close.Size = UDim2.fromOffset(44, 44)
close.Position = UDim2.new(1, -56, 0, 12)
close.BackgroundColor3 = Color3.fromRGB(40, 44, 60)
close.Text = "X"
close.TextColor3 = Color3.new(1, 1, 1)
close.Font = Enum.Font.GothamBold
close.TextSize = 20
close.Parent = panel
corner(close, 12)

local list = Instance.new("ScrollingFrame")
list.Size = UDim2.new(1, -32, 1, -84)
list.Position = UDim2.fromOffset(16, 72)
list.BackgroundTransparency = 1
list.ScrollBarThickness = 6
list.AutomaticCanvasSize = Enum.AutomaticSize.Y
list.CanvasSize = UDim2.new()
list.Parent = panel
local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 10)
layout.Parent = list

for _, item in ipairs(Config.Items) do
	local row = Instance.new("TextButton")
	row.Size = UDim2.new(1, -8, 0, 78)
	row.BackgroundColor3 = Color3.fromRGB(26, 30, 44)
	row.AutoButtonColor = true
	row.Text = ""
	row.Parent = list
	corner(row, 14)
	local name = Instance.new("TextLabel")
	name.Size = UDim2.new(1, -130, 0, 30)
	name.Position = UDim2.fromOffset(14, 10)
	name.BackgroundTransparency = 1
	name.Text = item.Name
	name.TextXAlignment = Enum.TextXAlignment.Left
	name.TextColor3 = Color3.new(1, 1, 1)
	name.Font = Enum.Font.GothamBold
	name.TextSize = 20
	name.Parent = row
	local desc = Instance.new("TextLabel")
	desc.Size = UDim2.new(1, -130, 0, 24)
	desc.Position = UDim2.fromOffset(14, 42)
	desc.BackgroundTransparency = 1
	desc.Text = item.Description
	desc.TextXAlignment = Enum.TextXAlignment.Left
	desc.TextColor3 = Color3.fromRGB(170, 178, 200)
	desc.Font = Enum.Font.Gotham
	desc.TextSize = 15
	desc.TextTruncate = Enum.TextTruncate.AtEnd
	desc.Parent = row
	local price = Instance.new("TextLabel")
	price.Size = UDim2.fromOffset(104, 44)
	price.Position = UDim2.new(1, -116, 0.5, -22)
	price.BackgroundColor3 = ACCENT
	price.Text = "R$ " .. item.Price
	price.TextColor3 = Color3.new(1, 1, 1)
	price.Font = Enum.Font.GothamBlack
	price.TextSize = 18
	price.Parent = row
	corner(price, 12)
	row.Activated:Connect(function()
		if item.Id == 0 then
			warn("[Boutique] " .. item.Name .. " n'a pas encore d'ID dans BloxiaConfig.")
			return
		end
		if item.Kind == "pass" then
			MarketplaceService:PromptGamePassPurchase(player, item.Id)
		else
			MarketplaceService:PromptProductPurchase(player, item.Id)
		end
	end)
end

open.Activated:Connect(function() panel.Visible = not panel.Visible end)
close.Activated:Connect(function() panel.Visible = false end)
`;

// ---------------------------------------------------------------------------------------------
// Genres : données sauvegardées, script de jeu, boutique, structure demandée à l'Assistant
// ---------------------------------------------------------------------------------------------
const G = {
  obby: {
    defaults: { Stage: 1, Coins: 0 }, stats: ['Stage', 'Coins'],
    items: [
      { key: 'Speed', name: 'Vitesse +50 %', kind: 'pass', price: 149, effect: 'Cours plus vite sur tout le parcours.', when: 'Montre-le dès l\'étape 3, quand le joueur a compris le jeu.' },
      { key: 'Trail', name: 'Traînée néon', kind: 'pass', price: 99, effect: 'Une traînée lumineuse derrière toi.', when: 'Affiche-le près du spawn : c\'est un objet de style que les autres voient.' },
      { key: 'SkipStage', name: 'Passer une étape', kind: 'product', price: 15, effect: 'Saute l\'étape où tu bloques.', when: 'Propose-le après 3 chutes au même endroit.' },
      { key: 'SkipFive', name: 'Passer 5 étapes', kind: 'product', price: 59, effect: 'Avance de 5 étapes d\'un coup.', when: 'À mettre à côté de « Passer une étape » : il paraît plus rentable.' }
    ],
    effects: `ProductEffects.SkipStage = function(player, data)
	local last = #workspace:WaitForChild("Checkpoints"):GetChildren()
	DataManager.Set(player, "Stage", math.min(data.Stage + 1, last))
	player:LoadCharacter()
end
ProductEffects.SkipFive = function(player, data)
	local last = #workspace:WaitForChild("Checkpoints"):GetChildren()
	DataManager.Set(player, "Stage", math.min(data.Stage + 5, last))
	player:LoadCharacter()
end`,
    passApply: `	if key == "Speed" and player.Character then
		local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
		if humanoid then humanoid.WalkSpeed = 24 end
	end
	if key == "Trail" then player:LoadCharacter() end`,
    core: { name: 'ObbyCore', code: `-- ObbyCore : checkpoints, parties mortelles, lave qui monte (Script)
-- Où : ServerScriptService > ObbyCore (Script)
-- Il faut : un dossier Workspace > Checkpoints avec des parties nommées 1, 2, 3...
-- et le tag "KillPart" sur les obstacles mortels (onglet Model > Tag Editor). Optionnel : une partie "RisingLava".
local Players = game:GetService("Players")
local CollectionService = game:GetService("CollectionService")
local DataManager = require(script.Parent:WaitForChild("DataManager"))
local checkpoints = workspace:WaitForChild("Checkpoints")

local function checkpointFor(stage)
	return checkpoints:FindFirstChild(tostring(stage)) or checkpoints:FindFirstChild("1")
end

local function addTrail(character)
	local root = character:WaitForChild("HumanoidRootPart")
	local a0 = Instance.new("Attachment")
	a0.Position = Vector3.new(0, 1, 0)
	a0.Parent = root
	local a1 = Instance.new("Attachment")
	a1.Position = Vector3.new(0, -1, 0)
	a1.Parent = root
	local trail = Instance.new("Trail")
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.6
	trail.LightEmission = 1
	trail.Color = ColorSequence.new(Color3.fromRGB(91, 156, 255), Color3.fromRGB(255, 197, 61))
	trail.Parent = root
end

Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		while not player:GetAttribute("DataLoaded") and player.Parent do task.wait(0.2) end
		local data = DataManager.Get(player)
		local root = character:WaitForChild("HumanoidRootPart")
		local humanoid = character:WaitForChild("Humanoid")
		local cp = data and checkpointFor(data.Stage)
		task.wait(0.1)
		if cp then root.CFrame = cp.CFrame + Vector3.new(0, 4, 0) end
		if player:GetAttribute("Pass_Speed") then humanoid.WalkSpeed = 24 end
		if player:GetAttribute("Pass_Trail") then addTrail(character) end
	end)
end)

for _, cp in ipairs(checkpoints:GetChildren()) do
	if cp:IsA("BasePart") then
		cp.Touched:Connect(function(hit)
			local player = Players:GetPlayerFromCharacter(hit.Parent)
			local data = player and DataManager.Get(player)
			local stage = tonumber(cp.Name)
			if data and stage and stage == data.Stage + 1 then
				DataManager.Set(player, "Stage", stage)
				DataManager.Add(player, "Coins", 5)
			end
		end)
	end
end

local function makeDeadly(part)
	part.Touched:Connect(function(hit)
		local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
		if humanoid and humanoid.Health > 0 then humanoid.Health = 0 end
	end)
end
for _, part in ipairs(CollectionService:GetTagged("KillPart")) do makeDeadly(part) end
CollectionService:GetInstanceAddedSignal("KillPart"):Connect(makeDeadly)

local lava = workspace:FindFirstChild("RisingLava")
if lava then
	makeDeadly(lava)
	local baseY = lava.Position.Y
	task.spawn(function()
		while true do
			for _ = 1, 30 do
				lava.Position = lava.Position + Vector3.new(0, 0.4, 0)
				task.wait(1)
			end
			lava.Position = Vector3.new(lava.Position.X, baseY, lava.Position.Z)
		end
	end)
end
` },
    structure: `Create a folder in Workspace named "Checkpoints" containing 20 anchored, flat, glowing green Parts named "1" to "20", one at the start of each stage (Part "1" is the spawn area, also add a SpawnLocation on it).
Build 20 stages between the checkpoints with increasing difficulty: jumps, moving platforms (TweenService), spinning beams, narrow paths. Every obstacle that should kill the player must have the CollectionService tag "KillPart".
Add a large anchored Part named "RisingLava" below the whole course (neon, semi-transparent), it will rise during play.
Put a golden finish platform after stage 20 with a sign "VICTOIRE".`
  },
  tycoon: {
    defaults: { Cash: 0, Unlocked: {} }, stats: ['Cash'],
    items: [
      { key: 'DoubleCash', name: 'Argent x2', kind: 'pass', price: 299, effect: 'Tout ce que tes machines produisent vaut double.', when: 'Montre-le dès le premier achat de machine.' },
      { key: 'AutoCollect', name: 'Collecte auto', kind: 'pass', price: 199, effect: 'L\'argent arrive direct, sans marcher sur le bouton.', when: 'Propose-le après 2 minutes de jeu.' },
      { key: 'CashPack', name: 'Pack de 5 000', kind: 'product', price: 49, effect: '5 000 d\'argent tout de suite.', when: 'Affiche-le quand le prochain achat coûte plus que ce que le joueur a.' },
      { key: 'StarterPack', name: 'Pack de départ', kind: 'product', price: 25, effect: '1 000 d\'argent pour démarrer vite.', when: 'Montre-le pendant la première minute.' }
    ],
    effects: `ProductEffects.CashPack = function(player)
	DataManager.Add(player, "Cash", 5000)
end
ProductEffects.StarterPack = function(player)
	DataManager.Add(player, "Cash", 1000)
end`,
    passApply: `	-- DoubleCash et AutoCollect sont lus directement par TycoonCore via les attributs du joueur.`,
    core: { name: 'TycoonCore', code: `-- TycoonCore : parcelles, machines, collecte et boutons d'achat (Script)
-- Où : ServerScriptService > TycoonCore (Script)
-- Il faut : Workspace > Tycoons, avec des modèles (une parcelle par joueur) contenant :
--   ClaimPad (Part), Collector (Part), CashPad (Part), Droppers (Folder de Parts),
--   Buttons (Folder de Parts avec les attributs Price = nombre et Unlock = nom d'un modèle de Items),
--   Items (Folder de modèles cachés au départ).
local Players = game:GetService("Players")
local Debris = game:GetService("Debris")
local DataManager = require(script.Parent:WaitForChild("DataManager"))
local tycoons = workspace:WaitForChild("Tycoons")

local owners = {}  -- [plot] = player
local pending = {} -- [plot] = argent en attente

local function setVisible(model, visible)
	for _, part in ipairs(model:GetDescendants()) do
		if part:IsA("BasePart") then
			part.Transparency = visible and (part:GetAttribute("BaseTransparency") or 0) or 1
			part.CanCollide = visible
		end
	end
	model:SetAttribute("Unlocked", visible)
end

local function plotOf(player)
	for plot, owner in pairs(owners) do
		if owner == player then return plot end
	end
end

local function unlock(plot, itemName)
	local item = plot.Items:FindFirstChild(itemName)
	if item then setVisible(item, true) end
	local button = plot.Buttons:FindFirstChild(itemName)
	if button then setVisible(button, false) end
end

local function claim(plot, player)
	if owners[plot] or plotOf(player) then return end
	owners[plot] = player
	pending[plot] = 0
	plot.ClaimPad.BrickColor = BrickColor.new("Bright green")
	local data = DataManager.Get(player)
	for _, name in ipairs(data.Unlocked) do unlock(plot, name) end
	for _, button in ipairs(plot.Buttons:GetChildren()) do
		local name = button:GetAttribute("Unlock") or button.Name
		setVisible(button, not table.find(data.Unlocked, name))
	end
end

local function reset(plot)
	owners[plot] = nil
	pending[plot] = 0
	plot.ClaimPad.BrickColor = BrickColor.new("Medium stone grey")
	for _, item in ipairs(plot.Items:GetChildren()) do setVisible(item, false) end
	for _, button in ipairs(plot.Buttons:GetChildren()) do setVisible(button, false) end
end

local function payOwner(plot, amount)
	local player = owners[plot]
	if not player then return end
	if player:GetAttribute("Pass_DoubleCash") then amount = amount * 2 end
	if player:GetAttribute("Pass_AutoCollect") then
		DataManager.Add(player, "Cash", amount)
	else
		pending[plot] = pending[plot] + amount
		plot.CashPad:SetAttribute("Pending", pending[plot])
	end
end

for _, plot in ipairs(tycoons:GetChildren()) do
	for _, part in ipairs(plot:GetDescendants()) do
		if part:IsA("BasePart") then part:SetAttribute("BaseTransparency", part.Transparency) end
	end
	reset(plot)
	plot.ClaimPad.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if player and player:GetAttribute("DataLoaded") then claim(plot, player) end
	end)
	plot.CashPad.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if player and owners[plot] == player and pending[plot] > 0 then
			DataManager.Add(player, "Cash", pending[plot])
			pending[plot] = 0
			plot.CashPad:SetAttribute("Pending", 0)
		end
	end)
	plot.Collector.Touched:Connect(function(hit)
		local value = hit:GetAttribute("OreValue")
		if value then
			hit:Destroy()
			payOwner(plot, value)
		end
	end)
	for _, button in ipairs(plot.Buttons:GetChildren()) do
		local debounce = false
		button.Touched:Connect(function(hit)
			local player = Players:GetPlayerFromCharacter(hit.Parent)
			if debounce or not player or owners[plot] ~= player or button:GetAttribute("Unlocked") == false then return end
			local data = DataManager.Get(player)
			local price = button:GetAttribute("Price") or 0
			local name = button:GetAttribute("Unlock") or button.Name
			if data and data.Cash >= price and not table.find(data.Unlocked, name) then
				debounce = true
				DataManager.Add(player, "Cash", -price)
				table.insert(data.Unlocked, name)
				unlock(plot, name)
				task.wait(0.5)
				debounce = false
			end
		end)
	end
end

Players.PlayerRemoving:Connect(function(player)
	local plot = plotOf(player)
	if plot then reset(plot) end
end)

-- Les machines produisent un minerai toutes les 2 secondes, si leur modèle est débloqué.
task.spawn(function()
	while true do
		task.wait(2)
		for plot, _ in pairs(owners) do
			for _, dropper in ipairs(plot.Droppers:GetChildren()) do
				local required = dropper:GetAttribute("RequiresItem")
				local item = required and plot.Items:FindFirstChild(required)
				local active = dropper:IsA("BasePart") and (not required or (item and item:GetAttribute("Unlocked")))
				if active then
					local ore = Instance.new("Part")
					ore.Size = Vector3.new(1, 1, 1)
					ore.Material = Enum.Material.Neon
					ore.Color = Color3.fromRGB(255, 197, 61)
					ore.CFrame = dropper.CFrame * CFrame.new(0, -2, 0)
					ore:SetAttribute("OreValue", dropper:GetAttribute("Value") or 5)
					ore.Parent = workspace
					Debris:AddItem(ore, 20)
				end
			end
		end
	end
end)
` },
    structure: `Create a folder in Workspace named "Tycoons" with 4 identical Models named "Plot1" to "Plot4", spaced apart. Each Model must contain exactly:
- an anchored Part "ClaimPad" (big flat pad at the entrance with a sign "Réclamer"),
- an anchored Part "Collector" (end of a conveyor belt, ores fall on it),
- an anchored Part "CashPad" (green pad near the base with a sign "Encaisser"),
- a Folder "Droppers" with 3 anchored Parts above the conveyor: the first has the attribute Value = 5; the second has Value = 15 and RequiresItem = "Dropper2"; the third has Value = 40 and RequiresItem = "Dropper3",
- a Folder "Items" with 6 Models: "Dropper2", "Dropper3" (decorative machines placed around the 2nd and 3rd dropper Parts), "Walls", "Upgrader", "Floor2", "Statue",
- a Folder "Buttons" with 6 anchored neon Parts named like the Items, each with the attributes Price (number: 50, 200, 500, 1200, 3000, 8000) and Unlock (the exact Item name), and a BillboardGui showing the name and price.
Add a conveyor belt (a Part with AssemblyLinearVelocity) from the droppers to the Collector.`
  },
  simulator: {
    defaults: { Coins: 0, Bag: 0, BagMax: 25 }, stats: ['Coins', 'Bag'],
    items: [
      { key: 'DoubleCoins', name: 'Pièces x2', kind: 'pass', price: 249, effect: 'Chaque récolte rapporte deux fois plus.', when: 'Montre-le à la première vente.' },
      { key: 'BigBag', name: 'Sac géant', kind: 'pass', price: 199, effect: 'Ton sac contient deux fois plus.', when: 'Propose-le quand le sac est plein pour la première fois.' },
      { key: 'Boost15', name: 'Boost x3 (15 min)', kind: 'product', price: 29, effect: 'Récolte x3 pendant 15 minutes.', when: 'Affiche-le avant un nouveau monde ou une mise à jour.' },
      { key: 'CoinPack', name: 'Pack de 2 500 pièces', kind: 'product', price: 39, effect: '2 500 pièces tout de suite.', when: 'Quand l\'amélioration suivante est presque atteignable.' }
    ],
    effects: `ProductEffects.Boost15 = function(player)
	local now = os.time()
	local current = player:GetAttribute("BoostUntil") or 0
	player:SetAttribute("BoostUntil", math.max(current, now) + 900)
end
ProductEffects.CoinPack = function(player)
	DataManager.Add(player, "Coins", 2500)
end`,
    passApply: `	-- DoubleCoins et BigBag sont lus directement par SimulatorCore via les attributs du joueur.`,
    core: { name: 'SimulatorCore', code: `-- SimulatorCore : récolte, sac, vente et amélioration (Script)
-- Où : ServerScriptService > SimulatorCore (Script)
-- Il faut : Workspace > Ores (Folder de Parts avec l'attribut Value), une Part "SellPad" et une Part "UpgradePad".
local Players = game:GetService("Players")
local DataManager = require(script.Parent:WaitForChild("DataManager"))
local ores = workspace:WaitForChild("Ores")
local sellPad = workspace:WaitForChild("SellPad")
local upgradePad = workspace:WaitForChild("UpgradePad")

local function capacity(player, data)
	local cap = data.BagMax
	if player:GetAttribute("Pass_BigBag") then cap = cap * 2 end
	return cap
end

local function multiplier(player)
	local m = 1
	if player:GetAttribute("Pass_DoubleCoins") then m = m * 2 end
	if (player:GetAttribute("BoostUntil") or 0) > os.time() then m = m * 3 end
	return m
end

local function setupOre(ore)
	if not ore:IsA("BasePart") then return end
	local click = Instance.new("ClickDetector")
	click.MaxActivationDistance = 24
	click.Parent = ore
	local cooling = false
	click.MouseClick:Connect(function(player)
		local data = DataManager.Get(player)
		if cooling or not data then return end
		local cap = capacity(player, data)
		if data.Bag >= cap then return end
		local gain = (ore:GetAttribute("Value") or 1) * multiplier(player)
		DataManager.Set(player, "Bag", math.min(cap, data.Bag + gain))
		cooling = true
		ore.Transparency = 0.8
		task.delay(4, function()
			ore.Transparency = 0
			cooling = false
		end)
	end)
end
for _, ore in ipairs(ores:GetChildren()) do setupOre(ore) end
ores.ChildAdded:Connect(setupOre)

sellPad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	local data = player and DataManager.Get(player)
	if data and data.Bag > 0 then
		DataManager.Add(player, "Coins", data.Bag)
		DataManager.Set(player, "Bag", 0)
	end
end)

local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Améliorer le sac"
prompt.ObjectText = "Amélioration"
prompt.HoldDuration = 0.3
prompt.Parent = upgradePad
prompt.Triggered:Connect(function(player)
	local data = DataManager.Get(player)
	if not data then return end
	local cost = data.BagMax * 4
	if data.Coins >= cost then
		DataManager.Add(player, "Coins", -cost)
		DataManager.Set(player, "BagMax", math.floor(data.BagMax * 1.6))
	end
end)
` },
    structure: `Create a folder in Workspace named "Ores" with 40 anchored collectible Parts spread over 3 zones (zone 1 near spawn: attribute Value = 1, zone 2: Value = 3, zone 3 farther: Value = 8). Make each zone look different and more impressive.
Add an anchored Part "SellPad" near the spawn (big flat pad with a sign "Vendre") and an anchored Part "UpgradePad" next to it (sign "Améliorer le sac").
Separate the zones with gates or bridges so players feel progression.`
  },
  horror: {
    defaults: { Coins: 0, Nights: 0 }, stats: ['Nights', 'Coins'],
    items: [
      { key: 'Flashlight', name: 'Lampe surpuissante', kind: 'pass', price: 149, effect: 'Une lampe qui éclaire très loin la nuit.', when: 'Montre-le juste avant la première nuit.' },
      { key: 'VIP', name: 'Accès VIP', kind: 'pass', price: 299, effect: 'Pièces x2 à chaque nuit survécue.', when: 'Après la première nuit survécue.' },
      { key: 'Revive', name: 'Revenir en jeu', kind: 'product', price: 19, effect: 'Réapparais tout de suite pendant la nuit.', when: 'Propose-le à chaque mort pendant la nuit.' },
      { key: 'CoinPack', name: 'Pack de 1 000 pièces', kind: 'product', price: 35, effect: '1 000 pièces tout de suite.', when: 'Dans la boutique principale.' }
    ],
    effects: `ProductEffects.Revive = function(player)
	player:LoadCharacter()
end
ProductEffects.CoinPack = function(player)
	DataManager.Add(player, "Coins", 1000)
end`,
    passApply: `	if key == "Flashlight" then player:LoadCharacter() end`,
    core: { name: 'HorrorCore', code: `-- HorrorCore : cycle jour / nuit, monstre et récompenses de survie (Script)
-- Où : ServerScriptService > HorrorCore (Script)
-- Il faut : ServerStorage > Monster (Model avec Humanoid et HumanoidRootPart), Workspace > MonsterSpawn (Part)
-- et Workspace > SafeZones (Folder de Parts : zones où le monstre ne te suit pas).
local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local ServerStorage = game:GetService("ServerStorage")
local DataManager = require(script.Parent:WaitForChild("DataManager"))

local DAY_SECONDS, NIGHT_SECONDS = 90, 120
local template = ServerStorage:WaitForChild("Monster")
local spawnPoint = workspace:WaitForChild("MonsterSpawn")
local safeZones = workspace:WaitForChild("SafeZones")

local function giveFlashlight(player, character)
	if not player:GetAttribute("Pass_Flashlight") then return end
	local tool = Instance.new("Tool")
	tool.Name = "Lampe"
	tool.RequiresHandle = true
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.4, 0.4, 1.6)
	handle.Parent = tool
	local light = Instance.new("SpotLight")
	light.Brightness = 6
	light.Range = 60
	light.Angle = 50
	light.Face = Enum.NormalId.Front
	light.Parent = handle
	tool.Parent = player:WaitForChild("Backpack")
end

Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		task.wait(0.5)
		giveFlashlight(player, character)
	end)
end)

local function inSafeZone(position)
	for _, zone in ipairs(safeZones:GetChildren()) do
		if zone:IsA("BasePart") then
			local p = zone.CFrame:PointToObjectSpace(position)
			local h = zone.Size / 2
			if math.abs(p.X) <= h.X and math.abs(p.Y) <= h.Y + 6 and math.abs(p.Z) <= h.Z then return true end
		end
	end
	return false
end

local function nearestTarget(from)
	local best, bestDist = nil, math.huge
	for _, player in ipairs(Players:GetPlayers()) do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if root and humanoid and humanoid.Health > 0 and not inSafeZone(root.Position) then
			local dist = (root.Position - from).Magnitude
			if dist < bestDist then best, bestDist = root, dist end
		end
	end
	return best
end

local function runNight()
	Lighting.ClockTime = 0
	Lighting.FogEnd = 120
	local monster = template:Clone()
	monster:PivotTo(spawnPoint.CFrame + Vector3.new(0, 4, 0))
	monster.Parent = workspace
	local humanoid = monster:FindFirstChildOfClass("Humanoid")
	local root = monster:FindFirstChild("HumanoidRootPart")
	humanoid.WalkSpeed = 18
	root.Touched:Connect(function(hit)
		local victim = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
		if victim and victim ~= humanoid and victim.Health > 0 then victim.Health = 0 end
	end)
	local finish = os.clock() + NIGHT_SECONDS
	while os.clock() < finish do
		local target = nearestTarget(root.Position)
		if target then humanoid:MoveTo(target.Position) end
		task.wait(0.4)
	end
	monster:Destroy()
	for _, player in ipairs(Players:GetPlayers()) do
		local character = player.Character
		local h = character and character:FindFirstChildOfClass("Humanoid")
		if h and h.Health > 0 then
			local reward = 50
			if player:GetAttribute("Pass_VIP") then reward = reward * 2 end
			DataManager.Add(player, "Coins", reward)
			DataManager.Add(player, "Nights", 1)
		end
	end
end

while true do
	Lighting.ClockTime = 14
	Lighting.FogEnd = 600
	task.wait(DAY_SECONDS)
	runNight()
end
` },
    structure: `Create the playable area: a medium-size explorable map with buildings, hiding spots and narrow paths.
Add a Folder in Workspace named "SafeZones" with 3 anchored, invisible (Transparency 1, CanCollide false) Parts covering 3 lit safe rooms.
Add an anchored invisible Part "MonsterSpawn" far from the player spawn.
In ServerStorage, create a Model named "Monster": a tall dark creature made of Parts, with a Humanoid and a HumanoidRootPart (set as PrimaryPart), unanchored, welded together, glowing eyes.`
  },
  td: {
    defaults: { Wins: 0, Coins: 0 }, stats: ['Wins', 'Coins'],
    items: [
      { key: 'DoubleCash', name: 'Argent x2 en partie', kind: 'pass', price: 249, effect: 'Chaque ennemi rapporte deux fois plus.', when: 'Dès la vague 2.' },
      { key: 'FastTowers', name: 'Tours rapides', kind: 'pass', price: 299, effect: 'Tes tours tirent deux fois plus vite.', when: 'Quand une vague passe pour la première fois.' },
      { key: 'Repair', name: 'Réparer la base', kind: 'product', price: 25, effect: 'La base revient à 100 % de vie.', when: 'Quand la base passe sous 30 %.' },
      { key: 'CashPack', name: 'Argent de départ', kind: 'product', price: 19, effect: '+300 d\'argent pour poser des tours.', when: 'Au début de chaque partie.' }
    ],
    effects: `ProductEffects.Repair = function()
	workspace:SetAttribute("BaseHealth", 100)
end
ProductEffects.CashPack = function(player)
	player:SetAttribute("RoundCash", (player:GetAttribute("RoundCash") or 0) + 300)
end`,
    passApply: `	-- DoubleCash et FastTowers sont lus directement par TowerDefenseCore via les attributs du joueur.`,
    core: { name: 'TowerDefenseCore', code: `-- TowerDefenseCore : vagues, chemin, tours et base (Script)
-- Où : ServerScriptService > TowerDefenseCore (Script)
-- Il faut : Workspace > Path (Parts nommées 1, 2, 3... dans l'ordre du chemin), Workspace > TowerSpots (Parts),
-- et ServerStorage > Enemy (Model avec Humanoid et HumanoidRootPart).
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local DataManager = require(script.Parent:WaitForChild("DataManager"))

local path = workspace:WaitForChild("Path")
local spots = workspace:WaitForChild("TowerSpots")
local template = ServerStorage:WaitForChild("Enemy")
local TOWER_COST, TOWER_RANGE, TOWER_DAMAGE, WAVES_TO_WIN = 100, 30, 15, 10
local enemies = {}

local function waypoints()
	local list = {}
	for i = 1, #path:GetChildren() do
		local p = path:FindFirstChild(tostring(i))
		if p then table.insert(list, p) end
	end
	return list
end

Players.PlayerAdded:Connect(function(player) player:SetAttribute("RoundCash", 200) end)

for _, spot in ipairs(spots:GetChildren()) do
	if spot:IsA("BasePart") then
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Poser une tour (" .. TOWER_COST .. ")"
		prompt.HoldDuration = 0.4
		prompt.Parent = spot
		prompt.Triggered:Connect(function(player)
			local cash = player:GetAttribute("RoundCash") or 0
			if spot:GetAttribute("Taken") or cash < TOWER_COST then return end
			player:SetAttribute("RoundCash", cash - TOWER_COST)
			spot:SetAttribute("Taken", true)
			prompt.Enabled = false
			local tower = Instance.new("Part")
			tower.Name = "Tower"
			tower.Anchored = true
			tower.Size = Vector3.new(3, 6, 3)
			tower.Material = Enum.Material.Neon
			tower.Color = Color3.fromRGB(91, 156, 255)
			tower.CFrame = spot.CFrame + Vector3.new(0, 3.5, 0)
			tower.Parent = workspace
			task.spawn(function()
				while tower.Parent do
					local target, best = nil, TOWER_RANGE
					for enemy, _ in pairs(enemies) do
						local root = enemy:FindFirstChild("HumanoidRootPart")
						if root then
							local d = (root.Position - tower.Position).Magnitude
							if d < best then target, best = enemy, d end
						end
					end
					if target then
						local h = target:FindFirstChildOfClass("Humanoid")
						if h then h:TakeDamage(TOWER_DAMAGE) end
					end
					task.wait(player:GetAttribute("Pass_FastTowers") and 0.5 or 1)
				end
			end)
		end)
	end
end

local function spawnEnemy(wave, route)
	local enemy = template:Clone()
	enemy:PivotTo(route[1].CFrame + Vector3.new(0, 3, 0))
	enemy.Parent = workspace
	local humanoid = enemy:FindFirstChildOfClass("Humanoid")
	humanoid.MaxHealth = 40 + wave * 20
	humanoid.Health = humanoid.MaxHealth
	enemies[enemy] = true
	humanoid.Died:Connect(function()
		enemies[enemy] = nil
		for _, player in ipairs(Players:GetPlayers()) do
			local reward = 10
			if player:GetAttribute("Pass_DoubleCash") then reward = reward * 2 end
			player:SetAttribute("RoundCash", (player:GetAttribute("RoundCash") or 0) + reward)
		end
		task.delay(1, function() enemy:Destroy() end)
	end)
	task.spawn(function()
		for i = 2, #route do
			if not enemy.Parent or humanoid.Health <= 0 then return end
			humanoid:MoveTo(route[i].Position)
			humanoid.MoveToFinished:Wait()
		end
		if enemies[enemy] then
			enemies[enemy] = nil
			workspace:SetAttribute("BaseHealth", (workspace:GetAttribute("BaseHealth") or 100) - 10)
			enemy:Destroy()
		end
	end)
end

while true do
	workspace:SetAttribute("BaseHealth", 100)
	local route = waypoints()
	local lost = false
	for wave = 1, WAVES_TO_WIN do
		workspace:SetAttribute("Wave", wave)
		task.wait(8)
		for _ = 1, 4 + wave * 2 do
			spawnEnemy(wave, route)
			task.wait(1)
		end
		while next(enemies) do
			if (workspace:GetAttribute("BaseHealth") or 0) <= 0 then lost = true break end
			task.wait(1)
		end
		if lost then break end
	end
	for enemy, _ in pairs(enemies) do enemy:Destroy() end
	enemies = {}
	if not lost then
		for _, player in ipairs(Players:GetPlayers()) do
			DataManager.Add(player, "Wins", 1)
			DataManager.Add(player, "Coins", 100)
		end
	end
	for _, spot in ipairs(spots:GetChildren()) do
		spot:SetAttribute("Taken", nil)
		local prompt = spot:FindFirstChildOfClass("ProximityPrompt")
		if prompt then prompt.Enabled = true end
	end
	for _, part in ipairs(workspace:GetChildren()) do
		if part.Name == "Tower" then part:Destroy() end
	end
	for _, player in ipairs(Players:GetPlayers()) do player:SetAttribute("RoundCash", 200) end
	task.wait(10)
end
` },
    structure: `Create a winding road for enemies and a Folder in Workspace named "Path" with 12 anchored, invisible Parts named "1" to "12" placed in order along the road (1 = enemy entrance, 12 = player base).
Build the player base at the end of the road (a castle or a core).
Add a Folder "TowerSpots" with 10 anchored round platforms along the road, clearly visible.
In ServerStorage, create a Model named "Enemy": a small creature made of Parts with a Humanoid and HumanoidRootPart (PrimaryPart), unanchored and welded.`
  },
  rp: {
    defaults: { Cash: 100 }, stats: ['Cash'],
    items: [
      { key: 'SalaryX2', name: 'Salaire x2', kind: 'pass', price: 249, effect: 'Ton salaire est doublé, quel que soit ton métier.', when: 'Après la première paie.' },
      { key: 'VIP', name: 'Statut VIP', kind: 'pass', price: 399, effect: 'Maisons VIP et badge VIP au-dessus de ta tête.', when: 'Près des maisons VIP : les joueurs les voient sans pouvoir entrer.' },
      { key: 'CashPack', name: 'Pack de 2 000', kind: 'product', price: 39, effect: '2 000 d\'argent tout de suite.', when: 'Dans la boutique principale.' },
      { key: 'BigCashPack', name: 'Pack de 10 000', kind: 'product', price: 149, effect: '10 000 d\'argent tout de suite.', when: 'À côté du petit pack : il paraît plus rentable.' }
    ],
    effects: `ProductEffects.CashPack = function(player)
	DataManager.Add(player, "Cash", 2000)
end
ProductEffects.BigCashPack = function(player)
	DataManager.Add(player, "Cash", 10000)
end`,
    passApply: `	if key == "VIP" then
		local function addTag(character)
		local head = character:WaitForChild("Head", 5)
		if head and not head:FindFirstChild("VIPTag") then
			local tag = Instance.new("BillboardGui")
			tag.Name = "VIPTag"
			tag.Size = UDim2.fromOffset(90, 32)
			tag.StudsOffset = Vector3.new(0, 2.6, 0)
			tag.AlwaysOnTop = true
			local label = Instance.new("TextLabel")
			label.Size = UDim2.fromScale(1, 1)
			label.BackgroundTransparency = 1
			label.Text = "VIP"
			label.TextColor3 = Color3.fromRGB(255, 197, 61)
			label.Font = Enum.Font.GothamBlack
			label.TextScaled = true
			label.Parent = tag
			tag.Parent = head
		end
		end
		if player.Character then task.spawn(addTag, player.Character) end
		player.CharacterAdded:Connect(addTag)
	end`,
    core: { name: 'RoleplayCore', code: `-- RoleplayCore : métiers, salaires et maisons (Script)
-- Où : ServerScriptService > RoleplayCore (Script)
-- Il faut : Workspace > JobBoards (Parts nommées comme les métiers ci-dessous)
-- et Workspace > Houses (Models avec une Part "Door" ; attribut VIP = true pour les maisons VIP).
local Players = game:GetService("Players")
local Teams = game:GetService("Teams")
local DataManager = require(script.Parent:WaitForChild("DataManager"))

local JOBS = {
	{ Name = "Citoyen", Salary = 20, Color = "Medium stone grey" },
	{ Name = "Policier", Salary = 45, Color = "Bright blue" },
	{ Name = "Medecin", Salary = 50, Color = "White" },
	{ Name = "Cuisinier", Salary = 35, Color = "Bright orange" },
}
local PAY_SECONDS = 60
local salaryByTeam = {}

for _, job in ipairs(JOBS) do
	local team = Teams:FindFirstChild(job.Name) or Instance.new("Team")
	team.Name = job.Name
	team.TeamColor = BrickColor.new(job.Color)
	team.AutoAssignable = job.Name == "Citoyen"
	team.Parent = Teams
	salaryByTeam[team] = job.Salary
	local board = workspace:WaitForChild("JobBoards"):FindFirstChild(job.Name)
	if board then
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Devenir " .. job.Name
		prompt.HoldDuration = 0.5
		prompt.Parent = board
		prompt.Triggered:Connect(function(player) player.Team = team end)
	end
end

task.spawn(function()
	while true do
		task.wait(PAY_SECONDS)
		for _, player in ipairs(Players:GetPlayers()) do
			local pay = salaryByTeam[player.Team] or 20
			if player:GetAttribute("Pass_SalaryX2") then pay = pay * 2 end
			DataManager.Add(player, "Cash", pay)
		end
	end
end)

local houseOwner = {}
for _, house in ipairs(workspace:WaitForChild("Houses"):GetChildren()) do
	local door = house:FindFirstChild("Door")
	if door then
		local claimPrompt = Instance.new("ProximityPrompt")
		claimPrompt.ActionText = house:GetAttribute("VIP") and "Réclamer (VIP)" or "Réclamer la maison"
		claimPrompt.HoldDuration = 0.8
		claimPrompt.Parent = door
		local lockPrompt = Instance.new("ProximityPrompt")
		lockPrompt.ActionText = "Ouvrir / fermer"
		lockPrompt.KeyboardKeyCode = Enum.KeyCode.F
		lockPrompt.Enabled = false
		lockPrompt.Parent = door
		claimPrompt.Triggered:Connect(function(player)
			if houseOwner[house] then return end
			if house:GetAttribute("VIP") and not player:GetAttribute("Pass_VIP") then return end
			for _, owner in pairs(houseOwner) do if owner == player then return end end
			houseOwner[house] = player
			claimPrompt.Enabled = false
			lockPrompt.Enabled = true
		end)
		lockPrompt.Triggered:Connect(function(player)
			if houseOwner[house] ~= player then return end
			door.CanCollide = not door.CanCollide
			door.Transparency = door.CanCollide and 0 or 0.7
		end)
	end
end

Players.PlayerRemoving:Connect(function(player)
	for house, owner in pairs(houseOwner) do
		if owner == player then
			houseOwner[house] = nil
			local door = house:FindFirstChild("Door")
			if door then
				door.CanCollide = true
				door.Transparency = 0
				for _, p in ipairs(door:GetChildren()) do
					if p:IsA("ProximityPrompt") then p.Enabled = p.ActionText ~= "Ouvrir / fermer" end
				end
			end
		end
	end
end)
` },
    structure: `Create a small town: roads, a central plaza, shops, a police station, a hospital and a restaurant.
Add a Folder in Workspace named "JobBoards" with 4 anchored sign Parts named exactly "Citoyen", "Policier", "Medecin", "Cuisinier", placed in front of the matching buildings.
Add a Folder "Houses" with 8 house Models; each has an anchored Part named "Door". Give 2 bigger houses the attribute VIP = true.`
  }
};

// ---------------------------------------------------------------------------------------------
// Assemblage du pack
// ---------------------------------------------------------------------------------------------
module.exports = function pack(lead) {
  const a = lead.answers || {};
  const gk = GENRES[a.genre] ? a.genre : (Object.keys(GENRES).find(k => GENRES[k].label === a.type) || 'obby');
  const tk = THEMES[a.theme] ? a.theme : 'grass';
  const g = GENRES[gk], t = THEMES[tk], spec = G[gk];
  const idea = String(a.phrase || `Un ${g.fr} sur le thème ${t.fr}`).slice(0, 180);
  const title = `${t.en} ${g.word}`;
  const beginner = /Jamais|bidouille/.test(a.xp || 'Jamais');

  const prompts = [
    { id: 'p1', titre: 'Construire le monde', but: 'Pose le décor complet de ta map, optimisé pour le mobile.',
      texte: `You are my Roblox Studio Assistant. I am building a ${g.en} game called "${title}". Game idea: "${idea}".
Use Planning mode: first show me a short plan, then build it after I approve.
Build the world for this game: ${t.world}.
Rules:
- Use only anchored Parts and Terrain (no free models, no external meshes).
- Colors: main ground ${t.ground}, rocks and structures ${t.rock}, accent and lights ${t.accent}.
- Keep it light for phones: under 1500 parts in total, group everything in Models inside a Folder "Map".
- Leave a clear, flat spawn area of about 40 x 40 studs with one SpawnLocation.
When you are done, list what you built and wait for my next message.`,
      verif: ['Un dossier « Map » existe dans Workspace', 'Un SpawnLocation est posé sur une zone plate', 'Le jeu tourne sans lag en appuyant sur Play'] },
    { id: 'p2', titre: 'Placer les éléments de gameplay', but: 'Crée les objets dont les scripts ont besoin, avec les bons noms.',
      texte: `Now add the gameplay structure. The names must be EXACTLY as written, because my scripts use them:
${spec.structure}
Do not write any script. Only build and name the objects. When done, list every object you created with its full path (for example Workspace > Checkpoints > 1).`,
      verif: ['Les noms correspondent exactement (majuscules comprises)', 'Les dossiers sont au bon endroit dans l\'Explorer'] },
    { id: 'p3', titre: 'Interface et écran de jeu', but: 'Ajoute un affichage clair de la monnaie et un écran d\'accueil.',
      texte: `Create a mobile-friendly ScreenGui in StarterGui named "HUD":
- a top-center bar that shows the player's stats from the leaderstats folder (${spec.stats.join(', ')}), updated live with a LocalScript,
- a welcome panel shown for 5 seconds when the player joins, with the game name "${title}" and one sentence explaining the goal,
- use UICorner, UIStroke and large text (min 18 px), colors: background #0e101a, accent ${t.accent}.
Do not touch the scripts in ServerScriptService.`,
      verif: ['La barre en haut affiche bien tes stats', 'Le panneau d\'accueil disparaît après 5 secondes', 'Le texte est lisible sur téléphone (bouton « Device » en haut de Studio)'] },
    { id: 'p4', titre: 'Ambiance, lumière et sons', but: 'Donne une vraie atmosphère à ton jeu.',
      texte: `Set up the atmosphere for ${t.world}:
- Lighting: choose Technology "Future" if available, tune ClockTime, Ambient, OutdoorAmbient and add an Atmosphere object matching this mood: ${t.mood}.
- Add a few ParticleEmitters in the decor (no more than 10 in total) that match the theme.
- Add looping ambient background music and 2 or 3 sound effects using sounds from the Roblox Creator Store that are free to use, and set their volume low (0.3).
Keep performance in mind for phones.`,
      verif: ['L\'ambiance colle au thème', 'Le son n\'est pas trop fort', 'Pas de baisse d\'images sur téléphone'] },
    { id: 'p5', titre: 'Test complet et optimisation', but: 'Fais tester ton jeu et corrige les problèmes avant de publier.',
      texte: `Playtest my game with your playtest tools and check:
1. the Output window has no red errors,
2. every gameplay object my scripts need exists with the right name: ${spec.structure.match(/"[^"]+"/g).slice(0, 8).join(', ')},
3. players cannot fall out of the map or get stuck at spawn,
4. the game works on a phone screen (touch controls, readable UI).
Fix every problem you find, then give me a short report of what you changed.`,
      verif: ['Aucune erreur rouge dans la fenêtre Output', 'Tu as fait un tour complet en tant que joueur', 'Le test sur téléphone est bon'] }
  ];

  const scripts = [
    { id: 's1', nom: 'BloxiaConfig', type: 'ModuleScript', ou: 'ReplicatedStorage', role: 'Réglages et identifiants de ta boutique.', code: configModule(title, spec.items) },
    { id: 's2', nom: 'DataManager', type: 'ModuleScript', ou: 'ServerScriptService', role: 'Sauvegarde les données des joueurs, avec réessais automatiques.', code: dataManager(spec.defaults) },
    { id: 's3', nom: 'PlayerSetup', type: 'Script', ou: 'ServerScriptService', role: 'Charge chaque joueur et affiche ses stats.', code: playerSetup(spec.stats) },
    { id: 's4', nom: spec.core.name, type: 'Script', ou: 'ServerScriptService', role: `Le cœur du gameplay de ton ${g.fr}.`, code: spec.core.code },
    { id: 's5', nom: 'ShopServer', type: 'Script', ou: 'ServerScriptService', role: 'Gère les Game Passes et les achats de façon sûre.', code: shopServer(spec.effects, spec.passApply) },
    { id: 's6', nom: 'ShopClient', type: 'LocalScript', ou: 'StarterPlayer > StarterPlayerScripts', role: 'Le bouton Boutique et sa fenêtre, adaptés au mobile.', code: shopClient(t.accent) }
  ];

  const start = [
    { t: 'Installe Roblox Studio', d: 'Gratuit, sur ordinateur (Windows ou Mac) : create.roblox.com, bouton « Start Creating ». Connecte-toi avec ton compte Roblox.' },
    { t: 'Crée ton jeu', d: 'Dans Studio : New > Baseplate. Puis File > Save to Roblox, donne le nom « ' + title + ' ». Ton jeu existe, il est privé pour l\'instant.' },
    { t: 'Autorise la sauvegarde des joueurs', d: 'Home > Game Settings > Security : active « Enable Studio Access to API Services ». Sans ça, la sauvegarde ne marche pas pendant tes tests.' },
    { t: 'Ouvre l\'Assistant', d: 'Bouton « Assistant » dans la barre du haut de Studio. C\'est là que tu colles les prompts, dans l\'ordre.' },
    { t: 'Ouvre l\'Explorer et la fenêtre Output', d: 'Onglet View : coche Explorer, Properties et Output. Tu en auras besoin pour coller les scripts et voir les erreurs.' }
  ];

  const shop = spec.items.map(i => ({ ...i, type: i.kind === 'pass' ? 'Game Pass' : 'Produit développeur' }));
  const shopSteps = [
    'Va sur create.roblox.com > Creations, et ouvre ton jeu.',
    'Monétisation > Passes : crée un Pass pour chaque Game Pass de la liste (nom, description, image carrée), puis mets-le en vente au prix indiqué.',
    'Monétisation > Produits développeur : crée chaque produit développeur au prix indiqué.',
    'Copie l\'ID de chaque objet (le long numéro) et colle-le à la place du 0 correspondant dans le script BloxiaConfig.',
    'Teste dans Studio : les achats en mode test ne coûtent pas de vrais Robux tant que tu n\'es pas sur le jeu publié. Vérifie que chaque effet marche.'
  ];

  const visuals = {
    specs: ['Icône : image carrée, au moins 512 x 512 px.', 'Miniatures : 1920 x 1080 px (format 16:9), jusqu\'à 10 images ou vidéos.', 'Pas de texte trop petit : l\'icône est souvent affichée en tout petit sur téléphone.'],
    icon: { brief: `Un seul élément fort au centre (le symbole de ton ${g.fr}), fond très coloré (${t.mood}), contour épais, zéro texte ou 1 mot maximum.`,
      prompt: `Roblox game icon, square, bold and colorful, ${t.world}, a single strong centerpiece representing a ${g.en}, blocky Roblox style, vibrant ${t.accent} accents, high contrast, thick outlines, no text, 3D render, centered composition` },
    thumbs: [
      { brief: 'L\'action principale : un joueur en plein moment fort du jeu, vu de près.', prompt: `Roblox game thumbnail 16:9, blocky Roblox avatar in an exciting action moment of a ${g.en}, ${t.world}, dramatic lighting, vibrant colors, cinematic angle, 3D render` },
      { brief: 'La progression : le joueur au début à gauche, puissant ou riche à droite.', prompt: `Roblox game thumbnail 16:9, split composition showing progression from beginner to powerful in a ${g.en}, ${t.world}, bright colors, clear contrast between left and right, 3D render` },
      { brief: 'Le monde : une vue large et belle de ta map, pour donner envie d\'explorer.', prompt: `Roblox game thumbnail 16:9, wide beautiful establishing shot of ${t.world}, blocky Roblox style, golden hour lighting, very colorful, inviting, 3D render` }
    ]
  };

  const listing = {
    titles: [`${title}`, `${title} [NOUVEAU]`, `${t.fr} ${g.label}`],
    description: `${idea}\n\nCe que tu peux faire :\n- ${({ obby: 'Franchir 20 étapes de plus en plus dures', tycoon: 'Construire ton empire machine par machine', simulator: 'Récolter, vendre et améliorer ton sac', horror: 'Survivre à la nuit et au monstre', td: 'Défendre ta base contre 10 vagues', rp: 'Choisir ton métier et ta maison' })[gk]}\n- Sauvegarde automatique de ta progression\n- Jouable sur téléphone, tablette et ordinateur\n\nLaisse un pouce vers le haut si tu aimes, de nouvelles mises à jour arrivent chaque semaine !`,
    settings: ['Remplis le questionnaire de maturité (obligatoire pour être visible).', 'Coche les appareils : téléphone, tablette, ordinateur, console si ton interface le permet.', `Genre : ${g.label}.`, 'Rends le jeu public : Creator Hub > ton jeu > Configuration > Public.']
  };

  const tiktok = [
    { titre: 'Le avant / après', hook: '« J\'ai créé un jeu Roblox en une phrase. »', plans: ['0-2 s : écran de Studio vide', '2-6 s : la map qui se construit en accéléré', '6-12 s : toi qui joues dedans, moment fort', '12-15 s : le nom du jeu à l\'écran'], legende: `J'ai fait ${title} sur Roblox, vous en pensez quoi ?`, tags: '#roblox #robloxstudio #robloxdev #gamedev' },
    { titre: 'Le défi', hook: `« Personne n'arrive à finir mon ${g.fr}. »`, plans: ['0-3 s : le passage le plus dur du jeu', '3-10 s : 3 échecs drôles à la suite', '10-15 s : « Toi, tu y arrives ? » avec le nom du jeu'], legende: 'Le lien est dans ma bio, montre-moi ton score', tags: '#roblox #robloxfyp #obby #challenge' },
    { titre: 'Les coulisses', hook: '« J\'ai 1 semaine pour faire un jeu Roblox qui marche. Jour 1. »', plans: ['0-3 s : toi face à l\'écran', '3-12 s : 3 choses faites aujourd\'hui, montrées rapidement', '12-15 s : « Abonne-toi pour voir le jour 2 »'], legende: 'Jour 1 de la création de mon jeu Roblox', tags: '#roblox #devlog #robloxstudio #jeuvideo' }
  ];

  const plan = [
    { j: 'Jour 1', t: 'Installe Studio, crée le jeu, colle les prompts 1 et 2.' },
    { j: 'Jour 2', t: 'Colle les 6 scripts, teste, corrige avec le prompt 5.' },
    { j: 'Jour 3', t: 'Prompts 3 et 4 : interface et ambiance. Fais tester à 2 amis.' },
    { j: 'Jour 4', t: 'Crée les Game Passes et produits, colle les ID dans BloxiaConfig.' },
    { j: 'Jour 5', t: 'Icône et miniatures, titre, description, questionnaire de maturité.' },
    { j: 'Jour 6', t: 'Publie le jeu en public. Poste la vidéo TikTok n° 1.' },
    { j: 'Jour 7', t: 'Regarde les retours des joueurs, corrige ce qui bloque. Vidéo n° 2.' },
    { j: 'Jour 8', t: 'Creator Hub > Analytics : regarde combien de joueurs reviennent le lendemain.' },
    { j: 'Jour 9', t: 'Améliore les 5 premières minutes : c\'est là que la plupart des joueurs partent.' },
    { j: 'Jour 10', t: 'Ajoute une récompense de connexion quotidienne (demande-la à l\'Assistant).' },
    { j: 'Jour 11', t: 'Change ta miniature principale et compare le taux de clic la semaine suivante.' },
    { j: 'Jour 12', t: 'Vidéo TikTok n° 3. Réponds aux commentaires en vidéo.' },
    { j: 'Jour 13', t: 'Ajoute du contenu : 5 nouvelles étapes, une zone ou un objet.' },
    { j: 'Jour 14', t: 'Publie la mise à jour et annonce-la dans la description et sur TikTok.' }
  ];

  const checklist = ['Aucune erreur rouge dans Output', 'La sauvegarde fonctionne (quitte et reviens)', 'Chaque achat de la boutique marche', 'Testé sur téléphone', 'Icône et 3 miniatures ajoutées', 'Questionnaire de maturité rempli', 'Jeu passé en public'];

  return {
    titre: title, idee: idea, genre: g.label, theme: t.fr, accent: t.accent, debutant: beginner,
    start, prompts, scripts, shop, shopSteps, visuals, listing, tiktok, plan, checklist,
    devex: 'Les Robux gagnés vont sur ton compte. Tu peux les convertir en argent réel avec le programme DevEx de Roblox (au taux officiel de 0,0038 $ par Robux gagné), à partir de 30 000 Robux gagnés et si tu as au moins 13 ans. Rien n\'est garanti : beaucoup de jeux mettent du temps à rapporter.'
  };
};
module.exports.GENRES = GENRES;
module.exports.THEMES = THEMES;
