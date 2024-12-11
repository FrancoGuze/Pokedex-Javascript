const display = document.getElementById('display');
const list = document.getElementById('pokemon-list');
const search = document.getElementById('search-bar')
const filtro = document.getElementById('filtro')
const filterMenu = document.querySelector('.filter-menu')

let actualPokemon = [];
let tiposPokemon = [];
let descripcionesPokemon = []


async function llamadoApi() {
  try {
    // Obtener la lista de pokémon, tipos y descripciones
    const [pokemonFetch, typesFetch, descriptionsFetch] = await Promise.all([
      await fetch('https://pokeapi.co/api/v2/pokemon?limit=151&offset=0'),
      await fetch('https://pokeapi.co/api/v2/type'),
      await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=151&offset=0')
    ])
    //convertir en json la respuesta obtenida del fetch
    const [pokemonData, tsData, descriptionsData] = [await pokemonFetch.json(), await typesFetch.json(), await descriptionsFetch.json()]

    //Guardar en variables los resultados del json
    const [pokemonList, typesList, descriptionsList] = [pokemonData.results, tsData.results, descriptionsData.results]

    //Traer la info de cada url obtenida anteriormente y esperar a que se cumplan las promesas
    const pokemonInfo = await Promise.all(pokemonList.map(pokemon => fetch(pokemon.url).then(res => res.json())))
    const typesInfo = await Promise.all(typesList.map(type => fetch(type.url).then(res => res.json())))
    const descriptionInfo = await Promise.all(descriptionsList.map(description => fetch(description.url).then(res => res.json())))

    //del resultado de fetchear cada url de los tipos de pokemon se guarda el nombre y la url de la imagen en un arreglo
    typesInfo.forEach(tipo => {
      let tipos = {
        nombre: tipo.name,
        img: tipo.sprites['generation-iii']['firered-leafgreen']['name_icon'] // Asegúrate de que la imagen exista
      };
      tiposPokemon.push(tipos);
    });
    // Agregar botones de tipo Pokémon
    tiposPokemon.map(tipo => {
      if (!tipo.nombre.match(/(stellar|fairy|unknown|dark)+/g)) {
        const buttonType = document.createElement('button');
        buttonType.classList.add('button-type');
        buttonType.id = tipo.nombre;
        buttonType.innerHTML = `
      <img src='${tipo.img}'>
    `;
        filterMenu.appendChild(buttonType);
      }
    });

    // Añadir el botón de "Limpiar Filtros" al final del menú de filtros
    const clearButton = document.createElement('button');
    clearButton.classList.add('clear-button', 'button-type');
    clearButton.innerText = "Clear";
    filterMenu.appendChild(clearButton);



    // Del resultado de fetchera cara url de las descricpiones, se guarda el nombre del pokemon y la descripcion
    descriptionInfo.forEach(desc => {
      let descripciones = {
        nombre: desc.name,
        descripcion: desc.flavor_text_entries.find(entry => entry.language.name === 'es').flavor_text,
        genus: desc.genera.find(entry => entry.language.name === 'es').genus
      }
      descripcionesPokemon.push(descripciones)
    })
    // devuelve la iteracion sobre todos los pokemons devueltos anteriormente
    pokemonInfo.forEach(pokemon => {
      const correctedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
      const correctedId = pokemon.id.toString().padStart(3, '0');
      const spritePixel = pokemon.sprites.front_default;

      // Conseguir tipo principal del pokemon y buscar la información en tiposPokemon
      let tipo1 = pokemon.types[0]?.type?.name || null; // El primer tipo
      let tipo2 = pokemon.types[1]?.type?.name || null; // El segundo tipo (si existe)

      // Buscar los tipos en el array tiposPokemon
      let tipoInfo1 = tiposPokemon.find(tipo => tipo.nombre === tipo1);
      let tipoInfo2 = tipo2 ? tiposPokemon.find(tipo => tipo.nombre === tipo2) : null;

      //Si el tipo del pokemon es Hada, se lo remplaza por tipo normal
      if (tipoInfo1.nombre === 'fairy' || tipoInfo2?.nombre === 'fairy') {
        tipoInfo1.img = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-iii/firered-leafgreen/1.png'
        tipoInfo2 = null
      }

      const li = document.createElement('li');
      li.classList.add('pokemon-card');
      li.id = pokemon.name;

      li.innerHTML = `
        <img loading='lazy' class="pokemon-sprite" src='${spritePixel}' alt='${pokemon.name}'>
        <h2>${correctedName}</h2>
        <h3>N° ${correctedId}</h3>
        <span class='pokemon-types'>
          <img class='type' src='${tipoInfo1?.img || ""}' alt='${tipo1}' />
          ${tipoInfo2 ? `<img class='type' src='${tipoInfo2?.img || ""}' alt='${tipo2}' />` : ''}
        </span>
      `;

      list.appendChild(li);


      li.addEventListener('click', () => {


        let description = descripcionesPokemon.find(poke => poke.nombre === pokemon.name)

        let hdSprite = pokemon.sprites.other['official-artwork'].front_default;
        let weight = pokemon.weight.toString().split('');
        weight.splice(weight.length - 1, 0, ',');
        let height = pokemon.height.toString().split('');
        height.splice(height.length - 1, 0, ',');

        let pokemonData = {
          name: correctedName,
          pokedexId: correctedId,
          pixelSprite: spritePixel,
          genus: description.genus,
          drawSprite: hdSprite,
          weight: weight.join(''),
          height: height.join(''),
          descripcion: description.descripcion,
          tipos: [tipo1, tipo2]
        };

        updateDisplay(pokemonData);
        pokemonData = []

      });

    });
  } catch (error) {
    console.log(error);
  }
}
//Event listener para la funcionalidad del filtro de busqueda
search.addEventListener('keyup', (e) => {
  document.querySelectorAll('.pokemon-card').forEach(card => {
    card.childNodes[3].innerText.toLowerCase().includes(e.target.value) ?
      card.classList.remove('hide') :
      card.classList.add('hide');
  })
})

filtro.addEventListener('click', (e) => {
  // Evitar que se cierre si se hace clic en el botón
  filterMenu.classList.remove('hide');
});

// Escuchar clics en cualquier parte del documento
document.addEventListener('click', (e) => {
  // Verifica si el clic fue fuera de `filterMenu` y fuera del botón `filtro`
  if (!filterMenu.contains(e.target) && !filtro.contains(e.target)) {
    filterMenu.classList.add('hide');  // Agregar la clase 'hide' de nuevo
  }
});

// Delegar el evento de clic en el filterMenu
filterMenu.addEventListener('click', function (e) {

  // Si se hace clic en un botón de tipo Pokémon
  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
    const clickedButton = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');

    if (clickedButton.classList.contains('clear-button')) {
      // Si es el botón de "Limpiar Filtros", mostrar todos los Pokémon
      document.querySelectorAll('.pokemon-card').forEach(card => {
        card.classList.remove('hide');
      });
      console.log('Filtros limpiados');
    } else {
      // Si es un botón de tipo Pokémon, aplicar el filtro correspondiente
      const tipoSeleccionado = clickedButton.id;
      document.querySelectorAll('.pokemon-card').forEach(card => {
        const tipo1 = card.querySelector('.pokemon-types img:nth-child(1)').alt;
        const tipo2 = card.querySelector('.pokemon-types img:nth-child(2)')?.alt;

        if (tipoSeleccionado === tipo1 || tipoSeleccionado === tipo2) {
          card.classList.remove('hide');
        } else {
          card.classList.add('hide');
        }
      });
      console.log('Tipo seleccionado:', tipoSeleccionado);
    }
  }
});



function updateDisplay(pokemonInfo) {
  display.innerHTML = `
  <div class='img-container'><img src='${pokemonInfo.drawSprite}'></div>
      <span class='name-id'><h4 class='pokedex-id'>N° ${pokemonInfo.pokedexId}</h4><h2 class='name'>${pokemonInfo.name}</h2></span>

  <div class='data-container'>
  <div>
        <h2 class='genus'>${pokemonInfo.genus}</h2>
        <h3 class='weight'>Peso: ${pokemonInfo.weight} kg</h3>
     <h3 class='height'>Altura: ${pokemonInfo.height.padStart(3, '0')} m</h3>
</div>
    
    <p class='description'>${pokemonInfo.descripcion}</p>
    
  </div>
    `

}

llamadoApi();
