import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  AccessTime,
  School,
  MenuBook
} from '@mui/icons-material';
import nlp from 'compromise';

const NLPAnalysis = ({ contentBlocks, isAnalysisEnabled = true }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    wordCount: 0,
    readingTime: 0,
    readingLevel: 'Medium',
    fleschKincaid: 0,
    fleschReading: 0,
    gunningFog: 0,
    smog: 0,
    colemanLiau: 0,
    automatedReadability: 0,
    avgGradeLevel: 0,
    avgSentenceLength: 0,
    avgWordLength: 0,
    complexWords: 0,
    syllablesPerWord: 0
  });

  // Extract plain text from all blocks
  const plainText = useMemo(() => {
    if (!contentBlocks || contentBlocks.length === 0) return '';
    
    return contentBlocks
      .map(block => {
        const tmp = document.createElement('div');
        tmp.innerHTML = block.content || '';
        return tmp.textContent || tmp.innerText || '';
      })
      .join(' ')
      .trim();
  }, [contentBlocks]);

  // Analyse text when it changes
  useEffect(() => {
    if (!isAnalysisEnabled || !plainText) {
      setStats({
        wordCount: 0,
        readingTime: 0,
        readingLevel: 'Medium',
        fleschKincaid: 0,
        fleschReading: 0,
        gunningFog: 0,
        smog: 0,
        colemanLiau: 0,
        automatedReadability: 0,
        avgGradeLevel: 0,
        avgSentenceLength: 0,
        avgWordLength: 0,
        complexWords: 0,
        syllablesPerWord: 0
      });
      return;
    }

    setIsAnalyzing(true);
    
    const timeoutId = setTimeout(() => {
      analyzeText(plainText);
      setIsAnalyzing(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
    };
  }, [plainText, isAnalysisEnabled]);

  const analyzeText = (text) => {
    if (!text) return;

    const doc = nlp(text);
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = doc.sentences().out('array');
    const sentenceCount = Math.max(sentences.length, 1);
    
    const wordsPerMinute = 225;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    
    const charCount = text.replace(/\s/g, '').length;
    const letterCount = text.replace(/[^a-zA-Z]/g, '').length;
    const avgWordLength = wordCount > 0 ? letterCount / wordCount : 0;
    const avgSentenceLength = wordCount / sentenceCount;
    
    const syllableData = countSyllablesEnhanced(words);
    const syllableCount = syllableData.totalSyllables;
    const complexWordCount = syllableData.complexWords;
    const syllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;
    
    const fleschReading = calculateFleschReadingEase(wordCount, sentenceCount, syllableCount);
    const fleschKincaid = calculateFleschKincaidGrade(wordCount, sentenceCount, syllableCount);
    const gunningFog = calculateGunningFog(wordCount, sentenceCount, complexWordCount);
    const smog = calculateSMOG(sentenceCount, complexWordCount);
    const colemanLiau = calculateColemanLiau(letterCount, wordCount, sentenceCount);
    const ari = calculateARI(charCount, wordCount, sentenceCount);
    
    const validScores = [fleschKincaid, gunningFog, smog, colemanLiau, ari].filter(s => s > 0);
    const avgGradeLevel = validScores.length > 0 
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
      : 0;
    
    const readingLevel = getConsensusReadingLevel(avgGradeLevel, fleschReading);
    
    setStats({
      wordCount,
      readingTime,
      readingLevel,
      fleschKincaid: Math.round(fleschKincaid * 10) / 10,
      fleschReading: Math.round(fleschReading * 10) / 10,
      gunningFog: Math.round(gunningFog * 10) / 10,
      smog: Math.round(smog * 10) / 10,
      colemanLiau: Math.round(colemanLiau * 10) / 10,
      automatedReadability: Math.round(ari * 10) / 10,
      avgGradeLevel: Math.round(avgGradeLevel * 10) / 10,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      complexWords: complexWordCount,
      syllablesPerWord: Math.round(syllablesPerWord * 100) / 100
    });
  };

  // --- Helpers ---
  const countSyllablesEnhanced = (words) => {
    let totalSyllables = 0;
    let complexWords = 0;

    const addSyllablePatterns = [/ia/, /eo/, /oa/, /ua/, /uo/, /tion/, /sion/, /ious/, /eous/, /ied/];
    const subtractSyllablePatterns = [/dge$/, /ked$/, /[^l]led$/, /[^r]red$/, /shed$/, /ted$/];

    words.forEach(word => {
      word = word.toLowerCase().replace(/[^a-z]/g, '');
      if (word.length === 0) return;

      let syllables = 0;
      let previousWasVowel = false;

      for (let i = 0; i < word.length; i++) {
        const isVowel = /[aeiou]/.test(word[i]);
        if (isVowel && !previousWasVowel) {
          syllables++;
        }
        previousWasVowel = isVowel;
      }

      addSyllablePatterns.forEach(pattern => {
        if (pattern.test(word)) syllables++;
      });

      subtractSyllablePatterns.forEach(pattern => {
        if (pattern.test(word)) syllables--;
      });

      if (word.endsWith('e') && !word.endsWith('le') && syllables > 1) {
        const beforeE = word.slice(-3, -1);
        if (!/[aeiou]e$/.test(word) && !/[lr]e$/.test(word)) {
          syllables--;
        }
      }

      if (word.length > 1 && word.endsWith('y') && !/[aeiou]y$/.test(word)) {
        syllables++;
      }

      syllables = Math.max(1, syllables);

      if (syllables >= 3) {
        const isSimpleEnding = /(ing|ed|es|ly)$/.test(word) && syllables === 3;
        if (!isSimpleEnding) {
          complexWords++;
        }
      }

      totalSyllables += syllables;
    });

    return { totalSyllables, complexWords };
  };

  const calculateFleschReadingEase = (words, sentences, syllables) => {
    if (words === 0 || sentences === 0) return 100;
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  };

  const calculateFleschKincaidGrade = (words, sentences, syllables) => {
    if (words === 0 || sentences === 0) return 0;
    const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    return Math.max(0, grade);
  };

  const calculateGunningFog = (words, sentences, complexWords) => {
    if (words === 0 || sentences === 0) return 0;
    const grade = 0.4 * ((words / sentences) + 100 * (complexWords / words));
    return Math.max(0, grade);
  };

  const calculateSMOG = (sentences, complexWords) => {
    if (sentences < 3) return 0;
    const grade = 1.0430 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
    return Math.max(0, grade);
  };

  const calculateColemanLiau = (letters, words, sentences) => {
    if (words === 0) return 0;
    const L = (letters / words) * 100;
    const S = (sentences / words) * 100;
    const grade = 0.0588 * L - 0.296 * S - 15.8;
    return Math.max(0, grade);
  };

  const calculateARI = (chars, words, sentences) => {
    if (words === 0 || sentences === 0) return 0;
    const grade = 4.71 * (chars / words) + 0.5 * (words / sentences) - 21.43;
    return Math.max(0, grade);
  };

  const getConsensusReadingLevel = (avgGrade, fleschReading) => {
    let level;
    if (avgGrade < 5) {
      level = 'Elementary';
    } else if (avgGrade < 8) {
      level = 'Middle School';
    } else if (avgGrade < 10) {
      level = 'Year 9-10';
    } else if (avgGrade < 12) {
      level = 'Year 11-12';
    } else if (avgGrade < 14) {
      level = 'University';
    } else if (avgGrade < 16) {
      level = 'Graduate';
    } else {
      level = 'Professional';
    }

    if (fleschReading > 80 && avgGrade > 8) {
      return 'Middle School';
    } else if (fleschReading < 30 && avgGrade < 12) {
      return 'Graduate';
    }

    return level;
  };

  const getReadingLevelColor = () => {
    if (stats.avgGradeLevel < 8) return 'success';
    if (stats.avgGradeLevel < 12) return 'info';
    if (stats.avgGradeLevel < 16) return 'warning';
    return 'error';
  };

  // --- Render ---
  if (!contentBlocks || contentBlocks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', color: 'text.secondary', flexWrap: 'wrap' }}>
        <Typography variant="body2">
          Start typing or paste content to see analysis
        </Typography>
      </Box>
    );
  }

  if (isAnalyzing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Analysing content...
        </Typography>
      </Box>
    );
  }

  return (
    <Stack 
      direction="row" 
      spacing={2} 
      sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, padding: '0' }}
    >
      {/* Reading Time */}
      <Tooltip 
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {stats.wordCount} words at ~225 words/minute
            </Typography>
            <Typography variant="caption">
              Average reading speed for educational content
            </Typography>
          </Box>
        }
      >
        <Chip
          icon={<AccessTime />}
          label={`${stats.readingTime} min read`}
          color="primary"
          variant="outlined"
          size="medium"
        />
      </Tooltip>

      {/* Reading Level */}
      <Tooltip
        title={
          <Box sx={{ minWidth: 280 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {stats.readingLevel} Level (Grade {stats.avgGradeLevel})
            </Typography>
            <Typography variant="caption" component="div">
              • Flesch-Kincaid: Grade {stats.fleschKincaid}
            </Typography>
            <Typography variant="caption" component="div">
              • Flesch Reading Ease: {stats.fleschReading}/100
            </Typography>
            <Typography variant="caption" component="div">
              • Gunning Fog: Grade {stats.gunningFog}
            </Typography>
            <Typography variant="caption" component="div">
              • SMOG Index: Grade {stats.smog}
            </Typography>
            <Typography variant="caption" component="div">
              • Coleman-Liau: Grade {stats.colemanLiau}
            </Typography>
            <Typography variant="caption" component="div">
              • ARI: Grade {stats.automatedReadability}
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 1 }}>
              • Avg sentence: {stats.avgSentenceLength} words
            </Typography>
            <Typography variant="caption" component="div">
              • Avg word: {stats.avgWordLength} letters
            </Typography>
            <Typography variant="caption" component="div">
              • Syllables/word: {stats.syllablesPerWord}
            </Typography>
            <Typography variant="caption" component="div">
              • Complex words: {stats.complexWords}
            </Typography>
          </Box>
        }
      >
        <Chip
          icon={<School />}
          label={`${stats.readingLevel} (Grade ${stats.avgGradeLevel})`}
          color={getReadingLevelColor()}
          variant="outlined"
          size="medium"
        />
      </Tooltip>

      {/* Word Count */}
      <Tooltip title="Total word count" sx={{ fontWeight: 'bold' }}>
        <Chip
          icon={<MenuBook />}
          label={`${stats.wordCount} words`}
          variant="outlined"
          size="medium"
        />
      </Tooltip>
    </Stack>
  );
};

export default NLPAnalysis;
