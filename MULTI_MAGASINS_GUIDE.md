# 🏪 Guide Fonctionnalité Multi-Magasins

## 📋 Vue d'Ensemble

La fonctionnalité **Multi-Magasins** permet à un utilisateur (généralement un Admin) de gérer **plusieurs magasins** depuis un seul compte. Cette fonctionnalité est disponible uniquement pour les plans Premium avec la fonctionnalité `multi_magasins` activée.

---

## 🎯 Comment ça fonctionne

### Scénario d'utilisation typique:

**Exemple:** Une entreprise possède 3 magasins:
- Magasin A (Casablanca)
- Magasin B (Rabat)  
- Magasin C (Marrakech)

Avec la fonctionnalité multi-magasins:
- Un Admin peut se connecter avec UN seul compte
- Il peut **basculer** entre les 3 magasins
- Il gère chaque magasin indépendamment
- Les données restent isolées par magasin

---

## 🗄️ Structure de Base de Données

### Table `users_magasins` (Nouvelle)
Table de liaison many-to-many entre utilisateurs et magasins:

```sql
users_magasins
├── id (PK)
├── user_id (FK → users)
├── magasin_id (FK → magasins)
├── role (admin, user) - Rôle dans ce magasin spécifique
├── actif (boolean)
└── created_at
```

**Exemple:**
```
user_id | magasin_id | role  | actif
--------|------------|-------|-------
1       | 10         | admin | true
1       | 11         | admin | true
1       | 12         | admin | true
```

### Table `users` (Modifiée)
- `magasin_id` reste pour le magasin principal (compatibilité)
- Les magasins supplémentaires sont dans `users_magasins`

---

## 🔄 Flux de Fonctionnement

### 1. **Création d'un compte multi-magasins**

**Par le Super Admin:**
1. Créer un magasin A avec plan Premium (multi_magasins activé)
2. Créer un Admin pour le magasin A
3. Créer un magasin B
4. **Associer le même Admin au magasin B** via `users_magasins`
5. Répéter pour magasin C, etc.

### 2. **Connexion de l'Admin**

1. L'Admin se connecte avec son email/mot de passe
2. Le système récupère **tous les magasins** auxquels il a accès:
   - Son magasin principal (`users.magasin_id`)
   - Les magasins secondaires (`users_magasins`)
3. L'interface affiche un **sélecteur de magasin**

### 3. **Sélection du magasin actif**

1. L'Admin choisit le magasin dans lequel il veut travailler
2. Le `magasinId` est stocké dans:
   - Le token JWT (temporaire)
   - localStorage (préférence utilisateur)
3. Toutes les requêtes suivantes utilisent ce `magasinId`

### 4. **Basculer entre magasins**

1. L'Admin clique sur le sélecteur de magasin
2. Choisit un autre magasin
3. Le système recharge l'interface avec les données du nouveau magasin
4. Les données sont automatiquement filtrées par le nouveau `magasinId`

---

## 🎨 Interface Utilisateur

### Dans le Layout Admin:

```tsx
// Sélecteur de magasin en haut de la sidebar
<MagasinSelector>
  <Select>
    <Option>Magasin A - Casablanca</Option>
    <Option>Magasin B - Rabat</Option>
    <Option>Magasin C - Marrakech</Option>
  </Select>
</MagasinSelector>
```

### Affichage:
- **Header/Sidebar:** Affiche le nom du magasin actif
- **Badge:** Indique le nombre de magasins accessibles
- **Menu déroulant:** Liste tous les magasins avec statut (actif/suspendu)

---

## 🔐 Sécurité et Isolation

### Règles importantes:

1. **Isolation des données:**
   - Chaque magasin garde ses données isolées
   - Impossible de voir les données d'un autre magasin
   - Les requêtes sont toujours filtrées par `magasinId`

2. **Vérification d'accès:**
   - Avant chaque requête, vérifier que l'utilisateur a accès au magasin
   - Utiliser la fonction `user_has_access_to_magasin(user_id, magasin_id)`

3. **Permissions par magasin:**
   - Un Admin peut avoir des permissions différentes dans chaque magasin
   - Stockées dans `users_magasins.role`

---

## 📝 Modifications Nécessaires

### Backend:

1. **Middleware `multiTenant.ts`:**
   - Modifier pour vérifier `users_magasins` en plus de `users.magasin_id`
   - Permettre le changement de magasin actif

2. **Controller `authController.ts`:**
   - Modifier `login` pour retourner la liste des magasins accessibles
   - Modifier `getProfile` pour inclure tous les magasins

3. **Nouveau endpoint:**
   - `POST /api/auth/switch-magasin` - Changer le magasin actif
   - `GET /api/auth/magasins` - Liste des magasins accessibles

4. **Controller `superAdminController.ts`:**
   - Ajouter fonction pour associer un utilisateur à plusieurs magasins
   - `POST /api/super-admin/users/:id/magasins` - Associer un magasin
   - `DELETE /api/super-admin/users/:id/magasins/:magasinId` - Retirer un magasin

### Frontend:

1. **Composant `MagasinSelector.tsx`:**
   - Dropdown pour sélectionner le magasin actif
   - Afficher le nom et le statut de chaque magasin

2. **Context `AuthContext.tsx`:**
   - Ajouter `availableMagasins` (liste des magasins accessibles)
   - Ajouter `currentMagasinId` (magasin actif)
   - Ajouter fonction `switchMagasin(magasinId)`

3. **Layout `AdminLayout.tsx`:**
   - Intégrer le sélecteur de magasin
   - Afficher le nom du magasin actif

4. **Middleware de routes:**
   - Vérifier que le magasin actif est valide
   - Rediriger si le magasin n'est plus accessible

---

## 🚀 Exemple d'Implémentation

### Backend - Endpoint pour changer de magasin:

```typescript
// POST /api/auth/switch-magasin
export const switchMagasin = async (req: AuthRequest, res: Response) => {
  try {
    const { magasinId } = req.body;
    const userId = req.user?.userId;

    // Vérifier que l'utilisateur a accès à ce magasin
    const hasAccess = await pool.query(
      `SELECT user_has_access_to_magasin($1, $2) as has_access`,
      [userId, magasinId]
    );

    if (!hasAccess.rows[0].has_access) {
      return res.status(403).json({ 
        message: 'Vous n\'avez pas accès à ce magasin' 
      });
    }

    // Mettre à jour le token avec le nouveau magasinId
    // (nécessite de régénérer le token)
    
    res.json({ 
      message: 'Magasin changé avec succès',
      magasinId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
```

### Frontend - Sélecteur de magasin:

```tsx
const MagasinSelector = () => {
  const { user, availableMagasins, switchMagasin } = useAuth();
  const [currentMagasin, setCurrentMagasin] = useState(user?.magasinId);

  const handleSwitch = async (newMagasinId: number) => {
    try {
      await switchMagasin(newMagasinId);
      setCurrentMagasin(newMagasinId);
      // Recharger les données du nouveau magasin
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors du changement de magasin');
    }
  };

  return (
    <Select value={currentMagasin} onChange={handleSwitch}>
      {availableMagasins?.map(magasin => (
        <option key={magasin.id} value={magasin.id}>
          {magasin.nom_magasin} - {magasin.statut}
        </option>
      ))}
    </Select>
  );
};
```

---

## ✅ Checklist d'Implémentation

### Phase 1: Base de données
- [ ] Créer la table `users_magasins`
- [ ] Créer la table `user_magasin_actif` (optionnel)
- [ ] Créer la fonction `user_has_access_to_magasin`
- [ ] Créer la vue `v_user_magasins`
- [ ] Migrer les données existantes si nécessaire

### Phase 2: Backend
- [ ] Modifier `authController.login` pour retourner les magasins
- [ ] Modifier `authController.getProfile` pour inclure les magasins
- [ ] Créer endpoint `switchMagasin`
- [ ] Créer endpoint `getAvailableMagasins`
- [ ] Modifier `multiTenant.ts` pour vérifier `users_magasins`
- [ ] Créer endpoints Super Admin pour gérer les associations

### Phase 3: Frontend
- [ ] Créer composant `MagasinSelector`
- [ ] Modifier `AuthContext` pour gérer les magasins
- [ ] Intégrer le sélecteur dans `AdminLayout`
- [ ] Gérer le changement de magasin
- [ ] Afficher le magasin actif partout

### Phase 4: Tests
- [ ] Tester l'association d'un utilisateur à plusieurs magasins
- [ ] Tester le basculement entre magasins
- [ ] Vérifier l'isolation des données
- [ ] Tester les permissions par magasin

---

## ⚠️ Points Importants

1. **Compatibilité:**
   - Les utilisateurs existants continuent de fonctionner (magasin principal)
   - La fonctionnalité est optionnelle (seulement si `multi_magasins` est activé)

2. **Performance:**
   - Les requêtes doivent toujours filtrer par `magasinId`
   - Utiliser des index sur `users_magasins`

3. **Sécurité:**
   - Toujours vérifier l'accès avant d'afficher/modifier des données
   - Ne jamais permettre l'accès à un magasin non autorisé

4. **UX:**
   - Le changement de magasin doit être rapide
   - Afficher clairement le magasin actif
   - Permettre de revenir facilement au magasin principal

---

## 📊 Exemple de Données

### Utilisateur avec accès à 3 magasins:

```json
{
  "user": {
    "id": 1,
    "email": "admin@entreprise.com",
    "magasinId": 10,  // Magasin principal
    "availableMagasins": [
      {
        "id": 10,
        "nom_magasin": "Magasin Casablanca",
        "statut": "actif",
        "type": "principal"
      },
      {
        "id": 11,
        "nom_magasin": "Magasin Rabat",
        "statut": "actif",
        "type": "secondaire"
      },
      {
        "id": 12,
        "nom_magasin": "Magasin Marrakech",
        "statut": "actif",
        "type": "secondaire"
      }
    ]
  }
}
```

---

**C'est ainsi que la fonctionnalité multi-magasins doit fonctionner! 🎉**




