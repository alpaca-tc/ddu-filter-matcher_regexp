# ddu-filter-matcher_regexp

RegExp matcher for ddu.vim

This matcher filters regexp matched items.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

## Configuration

```vim
call ddu#custom#patch_global(#{
    \   sourceOptions: #{
    \     _: #{
    \       matchers: ['matcher_regexp'],
    \     },
    \   }
    \ })

" Enable highlight matched text
" Note: It is slow
call ddu#custom#patch_global(#{
    \   filterParams: #{
    \     matcher_regexp: #{
    \       highlightMatched: 'Search',
    \     },
    \   }
    \ })
```
