import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { PokemonService } from '~features/pokemon/services/pokemon.service';
import { SlInputIconFocusDirective } from '~core/directives/sl-input-icon-focus.directive';
import { POKEMON_URLS } from '~core/constants/urls.constants';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { translations } from '../../../../../locale/translations';
import { AlertService } from '~core/services/ui/alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrimDirective } from '~core/directives/trim.directive';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pokemon-search-input',
  templateUrl: './pokemon-search-input.component.html',
  styleUrl: './pokemon-search-input.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [SlInputIconFocusDirective, NgOptimizedImage, TrimDirective],
})
export class PokemonSearchInputComponent {
  private readonly router = inject(Router);
  private readonly pokemonService = inject(PokemonService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = input<string>(translations.findPokemon);
  readonly termValue = signal('');
  readonly pokemonLoading = signal(false);
  readonly searchState = linkedSignal({
    source: this.termValue,
    computation: (term) => ({
      term,
      isLoading: term ? this.pokemonLoading() : false,
      showButton: term && this.pokemonLoading()
    })
  });

  searchPokemon() {
    const pokemonName = this.termValue().toLowerCase();
    if (pokemonName) {
      this.pokemonLoading.set(true);
      this.pokemonService
        .getPokemon(pokemonName)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (pokemon) => {
            this.pokemonLoading.set(false);
            this.termValue.set('');
            void this.router.navigate([POKEMON_URLS.detail(pokemon.name)]);
          },
          error: () => {
            this.pokemonLoading.set(false);
            this.alertService.createErrorAlert(translations.pokemonNotFoundError);
          },
        });
    }
  }

  assignInputValue(event: Event) {
    const inputEvent = event as CustomEvent;
    this.termValue.set((inputEvent.target as HTMLInputElement).value);
  }
}
