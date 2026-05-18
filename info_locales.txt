import requests
import sys
# Requête Overpass pour compter les poubelles sur Caen (exemple)
# On veut que cela nous renvoit du JSON avec une limite de temps de 180 secondes
# On définit une zone de recherche
# On recherche tous les points qui ont l'étiquette "poubelle" dans notre zone de recherche
# ont renvoit les informations trouvées
ma_requete_exemple1="""
[out:json][timeout:360];
area["wikipedia"="fr:Caen"]->.zone_de_recherche;
(
node["amenity"="waste_basket"](area.zone_de_recherche);
);
out body;
"""

ma_requete_exemple2="""
[out:json][timeout:360];
(
node["wikipedia"="fr:Caen"]["population"];
);
out body;
"""
#Envoie une requête à l'API Overpass et retourne le nombre d'éléments trouvés.
#Args: La requête au format Overpass QL.
#Returns: Le nombre total d'objets trouvés (la taille de la liste 'elements').

def get_dataset(query):
    url = "https://overpass-api.de/api/interpreter"
    r = requests.get(url, params={'data': query})
    reply=r.json()
    return reply

#Exécute une requête Overpass pour extraire la valeur du tag 'population'.
#Cette fonction va chercher précisément l'attribut 'population' du premier élément retourné par l'API.
#Args: La requête Overpass.
#Returns: La population convertie en nombre entier.
def get_dataset2(query):
    url = "https://overpass-api.de/api/interpreter"
    r = requests.get(url, params={'data': query})
    reply=r.json()
    response=reply['elements'][0]['tags']['population']
    return int(response)

#Calcule et affiche le ratio d'habitants par poubelle pour une ville donnée.
#Cette fonction génère deux requêtes Overpass (une pour les poubelles, une pour la population) en insérant le nom de la ville, puis effectue le calcul.
#Args: Le nom de la ville (doit correspondre au nom sur Wikipédia fr).
#Returns: Une phrase donnant la statistique arrondie à 2 décimales.
def compute_statistics(ville:str)-> str:
    # Construction de la requête pour compter les poubelles
    # On utilise une f-string pour insérer la variable {ville}
    ma_requete2=f"""
    [out:json][timeout:360];
    area["wikipedia"="fr:{ville}"]->.zone_de_recherche;
    (
    node["amenity"="waste_basket"](area.zone_de_recherche);
    );
    out body;
    """
    # Appel de la première fonction pour obtenir le nombre de poubelles
    poubelles=len(get_dataset(ma_requete2)["elements"])
    # Si aucune poubelle n'est trouvée on renvoit une phrase
    if poubelles == 0:
        return f"Aucune poubelle trouvée à {ville}"
    # Construction de la requête pour trouver la population de la ville
    ma_requete3=f"""
    [out:json][timeout:360];
    (
    node["wikipedia"="fr:{ville}"]["population"];
    );
    out body;
    """
    # Appel de la deuxième fonction pour obtenir la population
    population=get_dataset2(ma_requete3)
    print(f"Il y a {population} habitants pour {poubelles} poubelles.")
    # Calcul du ratio
    stats=population/poubelles
    # Renvoie la phrase finale avec un arrondi à 2 chiffres après la virgule
    return f"Soit {stats:.2f} habitants par poubelles à {ville}."


#Prend en arguments le dictionnaire contenant la liste des poubelles de Caen, la population de Caen et un nom de fichier.
#Stock la liste "elements" qui contient toutes le poubelles dans une variable.
#Construit un fichier en markdown avec les statistiques calculées et la liste de toutes les poubelles.
#Pour chaque poubelle on essaye de trouver sa matière et on y met un lien vers sa position exacte sur la carte.
def dataset_to_md(pbl:dict, population:int, filename:str, ville:str)->None:
    poubelles=pbl.get("elements", [])
    stats=population/len(poubelles)
    qualite=""
    if stats<=150:
        qualite="bon car moins de 150 habitants par poubelle."
    elif 150<stats<=300:
        qualite="moyen car entre 150 et 300 habitants par poubelle"
    elif stats>300:
        qualite="mauvais car plus de 300 habitants par poubelle"

    #----------MARKDOWN-----------------------------
    contenu=f"# Rapport : Les poubelles à {ville}\n\n"
    contenu+="## Statistiques\n\n"
    contenu+=f"- Nombre total de poubelles trouvées : {len(poubelles)}\n"
    contenu+=f"- Population trouvée : {population}\n"
    contenu+=f"- Ratio habitants/poubelle : {stats:.2f}\n"
    contenu+=f"- Le ratio habitants/poubelle est {qualite}"
    contenu+="\n---\n\n"
    contenu+="## Liste des poubelles trouvées\n\n"
    for i in poubelles:
        id=i.get("id")
        tags=i.get("tags",{})
        matiere=tags.get("material", "Matière non trouvée")
        contenu+=f"**Poubelle n°{id}**\n"
        contenu+=f"- Matière : {matiere}\n"  
        contenu+=f"- [Voir sur la carte](https://www.openstreetmap.org/node/{id})\n\n"

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(contenu)


from md_to_html import convert

def info_locales(ville:str)->None:
    filenamemd=f"InfoLocales{ville}.md"
    filenamehtml=f"InfoLocales{ville}.html"
    #--------------Requetes------------------
    RequetePoubelles=f"""
    [out:json][timeout:360];
    area["wikipedia"="fr:{ville}"]->.zone_de_recherche;
    (
    node["amenity"="waste_basket"](area.zone_de_recherche);
    );
    out body;
    """
    RequetePopulation=f"""
    [out:json][timeout:360];
    (
    node["wikipedia"="fr:{ville}"]["population"];
    );
    out body;
    """
    #----------------Markdown------------------
    dataset_to_md(get_dataset(RequetePoubelles), get_dataset2(RequetePopulation), filenamemd, ville)
    print(f"Fichier markdown généré : {filenamemd}")
    
    #---------------HTML-----------------------
    convert(filenamemd, filenamehtml)
    print(f"Fichier html généré : {filenamehtml}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        ville_choisie = sys.argv[1]
    else:
        ville_choisie = "Caen"
        print(f"Aucune ville précisée, exécution par défaut pour {ville_choisie}...")
    info_locales(ville_choisie)

